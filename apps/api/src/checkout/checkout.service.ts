import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import Stripe from 'stripe';

@Injectable()
export class CheckoutService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  async calculateQuote(items: Array<{ product_id: number; qty: number }>, tipCents = 0) {
    if (!items || !items.length) {
      throw new BadRequestException('Your cart is empty');
    }

    const deliveryFeePerStore = 599; // $5.99
    const serviceFeeRate = 0.05;    // 5%
    const serviceFeeMin = 199;      // $1.99
    const driverBasePay = 550;      // $5.50
    const minOrderCents = 1500;     // $15.00

    const byStore = new Map<number, { store: any; items: any[] }>();

    for (const it of items) {
      const productId = Number(it.product_id ?? (it as any).productId ?? (it as any).id);
      if (!productId || isNaN(productId)) {
        continue;
      }
      const qty = Math.max(1, Math.min(99, Math.floor(it.qty || 1)));
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { store: true },
      });

      if (!product || !product.active) {
        throw new BadRequestException('An item in your cart is no longer available');
      }
      if (product.store.status !== 'active') {
        throw new BadRequestException(`${product.store.name} is not accepting orders right now`);
      }
      if (product.stock < qty) {
        throw new BadRequestException(`Only ${product.stock} left of ${product.name}`);
      }

      if (!byStore.has(product.storeId)) {
        byStore.set(product.storeId, { store: product.store, items: [] });
      }
      byStore.get(product.storeId).items.push({ product, qty });
    }

    const storeGroups = [];
    let grandSubtotal = 0;
    let grandDeliveryFee = 0;
    let grandServiceFee = 0;

    for (const [storeId, group] of byStore.entries()) {
      const subtotal = group.items.reduce((sum, item) => sum + item.product.priceCents * item.qty, 0);
      const deliveryFee = deliveryFeePerStore;
      const serviceFee = Math.max(serviceFeeMin, Math.round(subtotal * serviceFeeRate));
      const totalQty = group.items.reduce((sum, item) => sum + item.qty, 0);
      const bags = Math.max(1, Math.ceil(totalQty / 10));

      grandSubtotal += subtotal;
      grandDeliveryFee += deliveryFee;
      grandServiceFee += serviceFee;

      storeGroups.push({
        store_id: storeId,
        store_name: group.store.name,
        commission_rate: group.store.commissionRate,
        subtotal_cents: subtotal,
        delivery_fee_cents: deliveryFee,
        service_fee_cents: serviceFee,
        bags,
        items: group.items,
      });
    }

    const safeTip = Math.max(0, Math.min(tipCents || 0, 50000));
    const grandTotal = grandSubtotal + grandDeliveryFee + grandServiceFee + safeTip;

    return {
      subtotal_cents: grandSubtotal,
      delivery_fee_cents: grandDeliveryFee,
      service_fee_cents: grandServiceFee,
      tip_cents: safeTip,
      total_cents: grandTotal,
      min_order_cents: minOrderCents,
      stores: storeGroups.map((g) => ({
        store_id: g.store_id,
        store_name: g.store_name,
        subtotal_cents: g.subtotal_cents,
        delivery_fee_cents: g.delivery_fee_cents,
        service_fee_cents: g.service_fee_cents,
        bags: g.bags,
      })),
      groups: storeGroups,
    };
  }

  async createCheckout(
    userId: number,
    body: {
      items: Array<{ product_id: number; qty: number }>;
      window_id: number;
      tip_cents?: number;
      address?: { line1: string; line2?: string; city: string; state: string; zip: string };
      phone?: string;
      notes?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const quote = await this.calculateQuote(body.items, body.tip_cents);
    if (quote.subtotal_cents < quote.min_order_cents) {
      throw new BadRequestException(`Minimum order is $${(quote.min_order_cents / 100).toFixed(2)}`);
    }

    const window = await this.prisma.deliveryWindow.findUnique({ where: { id: body.window_id } });
    if (!window || !window.active) {
      throw new BadRequestException('Please choose a valid active delivery window');
    }

    const addr = body.address || {
      line1: '8401 Colesville Rd',
      line2: '',
      city: 'Silver Spring',
      state: 'MD',
      zip: '20910',
    };
    const phone = body.phone?.trim() || user.phone || '(301) 555-0199';

    // Create checkout container
    const checkout = await this.prisma.checkout.create({
      data: {
        customerId: user.id,
        totalCents: quote.total_cents,
        paymentStatus: 'pending',
      },
    });

    const tipPerStore = Math.floor(quote.tip_cents / quote.groups.length);
    const tipRemainder = quote.tip_cents - tipPerStore * quote.groups.length;

    const baseSeq = 10000 + checkout.id;
    const subOrderLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const createdOrders = [];

    for (let i = 0; i < quote.groups.length; i++) {
      const g = quote.groups[i];
      const tipForOrder = tipPerStore + (i === 0 ? tipRemainder : 0);
      const commission = Math.round(g.subtotal_cents * g.commission_rate);
      const driverPay = 550 + tipForOrder;
      const orderTotal = g.subtotal_cents + g.delivery_fee_cents + g.service_fee_cents + tipForOrder;

      // Sub-order numbering per agreement: BD-10042-A, BD-10042-B
      const orderNumber = quote.groups.length > 1
        ? `BD-${baseSeq}-${subOrderLetters[i] || i}`
        : `BD-${baseSeq}`;

      const order = await this.prisma.order.create({
        data: {
          number: orderNumber,
          checkoutId: checkout.id,
          customerId: user.id,
          storeId: g.store_id,
          windowId: window.id,
          status: 'pending_payment',
          subtotalCents: g.subtotal_cents,
          deliveryFeeCents: g.delivery_fee_cents,
          serviceFeeCents: g.service_fee_cents,
          tipCents: tipForOrder,
          totalCents: orderTotal,
          commissionCents: commission,
          driverPayCents: driverPay,
          bags: g.bags,
          addressLine1: addr.line1,
          addressLine2: addr.line2 || null,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          phone,
          notes: body.notes?.trim() || null,
          items: {
            create: g.items.map((it: any) => ({
              productId: it.product.id,
              name: it.product.name,
              emoji: it.product.emoji,
              unit: it.product.unit,
              priceCents: it.product.priceCents,
              qty: it.qty,
            })),
          },
          events: {
            create: {
              status: 'pending_payment',
              note: 'Checkout initiated',
              actor: 'customer',
            },
          },
        },
      });
      createdOrders.push(order);
    }

    let clientSecret = `pi_demo_${Date.now()}_secret`;
    let intentId = `pi_demo_${Date.now()}`;

    if (this.stripe) {
      const intent = await this.stripe.paymentIntents.create({
        amount: quote.total_cents,
        currency: 'usd',
        receipt_email: user.email,
        metadata: {
          checkout_id: String(checkout.id),
          customer_id: String(user.id),
          orders: createdOrders.map((o) => o.number).join(','),
        },
        automatic_payment_methods: { enabled: true },
      });
      clientSecret = intent.client_secret;
      intentId = intent.id;
    }

    await this.prisma.checkout.update({
      where: { id: checkout.id },
      data: { paymentIntentId: intentId },
    });

    return {
      checkout_id: checkout.id,
      client_secret: clientSecret,
      amount_cents: quote.total_cents,
      order_ids: createdOrders.map((o) => o.id),
      mode: this.stripe ? 'stripe' : 'demo',
    };
  }

  async confirmCheckout(userId: number, checkoutId: number, paymentMethod = 'card') {
    const checkout = await this.prisma.checkout.findFirst({
      where: { id: checkoutId, customerId: userId },
      include: {
        orders: {
          include: {
            items: true,
            store: true,
          },
        },
      },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    if (checkout.paymentStatus !== 'paid') {
      await this.prisma.checkout.update({
        where: { id: checkout.id },
        data: {
          paymentStatus: 'paid',
          paymentMethod,
        },
      });

      for (const order of checkout.orders) {
        // Deduct inventory
        for (const it of order.items) {
          if (it.productId) {
            await this.prisma.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.qty } },
            });
          }
        }

        // Move status to placed
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'placed' },
        });

        await this.prisma.orderEvent.create({
          data: {
            orderId: order.id,
            status: 'placed',
            note: 'Payment confirmed via ' + paymentMethod,
            actor: 'customer',
          },
        });

        // Trigger real-time alert / kitchen chime to store!
        this.eventsGateway.emitNewOrder({
          orderId: order.id,
          orderNumber: order.number,
          storeId: order.storeId,
          storeName: order.store.name,
          subtotalCents: order.subtotalCents,
          bags: order.bags,
        });
      }
    }

    const updatedOrders = await this.prisma.order.findMany({
      where: { checkoutId: checkout.id },
      include: {
        store: true,
        items: true,
        window: true,
      },
    });

    return {
      ok: true,
      orders: updatedOrders,
    };
  }
}

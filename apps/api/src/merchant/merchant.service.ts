import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import Stripe from 'stripe';

@Injectable()
export class MerchantService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  private async getStoreForUser(userId: number) {
    const store = await this.prisma.store.findFirst({ where: { ownerId: userId } });
    if (!store) {
      throw new NotFoundException('No storefront found for this merchant account');
    }
    return store;
  }

  async getSummary(userId: number) {
    const store = await this.getStoreForUser(userId);

    const upcomingOrders = await this.prisma.order.findMany({
      where: {
        storeId: store.id,
        status: { notIn: ['pending_payment', 'cancelled', 'refunded'] },
      },
      include: { window: true },
    });

    const counts: Record<string, number> = {
      placed: 0,
      accepted: 0,
      packing: 0,
      ready: 0,
      picked_up: 0,
      delivered: 0,
    };

    let bagsNeeded = 0;
    for (const o of upcomingOrders) {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
      if (['placed', 'accepted', 'packing', 'ready'].includes(o.status)) {
        bagsNeeded += o.bags;
      }
    }

    const deliveredOrders = await this.prisma.order.findMany({
      where: { storeId: store.id, status: 'delivered' },
    });

    const totalSales = deliveredOrders.reduce((acc, o) => acc + o.subtotalCents, 0);
    const totalPayout = deliveredOrders.reduce((acc, o) => acc + (o.subtotalCents - o.commissionCents), 0);

    const lowStock = await this.prisma.product.findMany({
      where: { storeId: store.id, active: true, stock: { lt: 15 } },
      take: 6,
      orderBy: { stock: 'asc' },
    });

    return {
      store,
      counts,
      bags_needed: bagsNeeded,
      totals: {
        orders: deliveredOrders.length,
        sales: totalSales,
        payout: totalPayout,
      },
      low_stock: lowStock,
    };
  }

  async getStore(userId: number) {
    return { store: await this.getStoreForUser(userId) };
  }

  async updateStore(userId: number, body: any) {
    const store = await this.getStoreForUser(userId);
    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: {
        name: body.name?.trim() || undefined,
        tagline: body.tagline?.trim() || undefined,
        description: body.description?.trim() || undefined,
        category: body.category?.trim() || undefined,
        address: body.address?.trim() || undefined,
        city: body.city?.trim() || undefined,
        state: body.state?.trim() || undefined,
        zip: body.zip?.trim() || undefined,
        phone: body.phone?.trim() || undefined,
        color: body.color || undefined,
        emoji: body.emoji || undefined,
        logoUrl: body.logo_url || undefined,
      },
    });
    return { store: updated };
  }

  async getProducts(userId: number) {
    const store = await this.getStoreForUser(userId);
    const products = await this.prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return { products };
  }

  async createProduct(userId: number, body: any) {
    const store = await this.getStoreForUser(userId);
    const priceCents = Math.round(Number(body.price || (body.price_cents ? body.price_cents / 100 : 0)) * 100);

    if (!body.name?.trim() || priceCents <= 0) {
      throw new BadRequestException('Product name and valid price are required');
    }

    const product = await this.prisma.product.create({
      data: {
        storeId: store.id,
        name: body.name.trim(),
        description: body.description?.trim() || '',
        category: body.category?.trim() || 'General',
        priceCents,
        unit: body.unit?.trim() || 'each',
        stock: Math.max(0, parseInt(body.stock || 20, 10)),
        emoji: body.emoji?.trim() || '🛒',
        imageUrl: body.image_url || null,
        active: body.active !== undefined ? Boolean(body.active) : true,
      },
    });
    return { product };
  }

  async updateProduct(userId: number, productId: number, body: any) {
    const store = await this.getStoreForUser(userId);
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const priceCents = body.price !== undefined
      ? Math.round(Number(body.price) * 100)
      : body.price_cents !== undefined
        ? parseInt(body.price_cents, 10)
        : existing.priceCents;

    const updated = await this.prisma.product.update({
      where: { id: existing.id },
      data: {
        name: body.name?.trim() || undefined,
        description: body.description?.trim() || undefined,
        category: body.category?.trim() || undefined,
        priceCents,
        unit: body.unit?.trim() || undefined,
        stock: body.stock !== undefined ? Math.max(0, parseInt(body.stock, 10)) : undefined,
        emoji: body.emoji?.trim() || undefined,
        imageUrl: body.image_url !== undefined ? body.image_url : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
      },
    });
    return { product: updated };
  }

  async deleteProduct(userId: number, productId: number) {
    const store = await this.getStoreForUser(userId);
    await this.prisma.product.updateMany({
      where: { id: productId, storeId: store.id },
      data: { active: false },
    });
    return { ok: true };
  }

  async getOrders(userId: number, status?: string) {
    const store = await this.getStoreForUser(userId);
    const where: any = {
      storeId: store.id,
      status: { not: 'pending_payment' },
    };
    if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
        window: true,
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { id: 'desc' },
      take: 200,
    });

    return {
      orders: orders.map((o) => ({
        ...o,
        item_count: o.items.reduce((sum, it) => sum + it.qty, 0),
      })),
    };
  }

  async updateOrderStatus(userId: number, orderId: number, nextStatus: string, bags?: number, note?: string) {
    const store = await this.getStoreForUser(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: store.id },
      include: { checkout: true, items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const validTransitions: Record<string, string[]> = {
      placed: ['accepted', 'cancelled'],
      accepted: ['packing', 'cancelled'],
      packing: ['ready'],
      ready: [],
    };

    if (!(validTransitions[order.status] || []).includes(nextStatus)) {
      throw new BadRequestException(`Cannot change order status from ${order.status} to ${nextStatus}`);
    }

    if (nextStatus === 'cancelled') {
      if (this.stripe && order.checkout?.paymentIntentId) {
        try {
          await this.stripe.refunds.create({
            payment_intent: order.checkout.paymentIntentId,
            amount: order.totalCents,
          });
        } catch (err) {
          console.error('Stripe refund failed:', err.message);
        }
      }
      for (const it of order.items) {
        if (it.productId) {
          await this.prisma.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.qty } },
          });
        }
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        bags: nextStatus === 'ready' && bags ? Math.max(1, Math.min(30, bags)) : undefined,
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: nextStatus,
        note: note || (nextStatus === 'ready' ? `Packed in ${updated.bags} sealed BuckDuck bags` : `Status moved to ${nextStatus}`),
        actor: 'merchant',
      },
    });

    this.eventsGateway.emitOrderStatusUpdate({
      orderId: order.id,
      status: nextStatus,
      storeId: store.id,
    });

    if (nextStatus === 'ready') {
      // Driver job board notification!
      this.eventsGateway.emitJobAvailable({
        orderId: order.id,
        orderNumber: order.number,
        storeName: store.name,
        bags: updated.bags,
        driverPayCents: order.driverPayCents,
      });
    }

    return { order: updated };
  }

  async getPayouts(userId: number) {
    const store = await this.getStoreForUser(userId);
    const delivered = await this.prisma.order.findMany({
      where: { storeId: store.id, status: 'delivered' },
      include: { window: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const pending = await this.prisma.order.findMany({
      where: {
        storeId: store.id,
        status: { in: ['placed', 'accepted', 'packing', 'ready', 'picked_up'] },
      },
    });

    const pendingCents = pending.reduce((sum, o) => sum + (o.subtotalCents - o.commissionCents), 0);

    return {
      store: {
        id: store.id,
        commission_rate: store.commissionRate,
        stripe_account_id: store.stripeAccountId,
        stripe_charges_enabled: store.stripeChargesEnabled,
      },
      orders: delivered,
      pending_cents: pendingCents,
      payments_mode: this.stripe ? 'stripe' : 'demo',
    };
  }

  async onboardStripe(userId: number, returnUrl: string) {
    const store = await this.getStoreForUser(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!this.stripe) {
      // Mock demo connection
      await this.prisma.store.update({
        where: { id: store.id },
        data: {
          stripeAccountId: `acct_demo_${Date.now()}`,
          stripeChargesEnabled: true,
        },
      });
      return { url: null, connected: true };
    }

    let accountId = store.stripeAccountId;
    if (!accountId) {
      const acct = await this.stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        business_type: 'company',
        business_profile: {
          name: store.name,
          mcc: '5411', // Grocery stores
          product_description: 'Grocery store selling on BuckDuck marketplace',
        },
        capabilities: { transfers: { requested: true } },
      });
      accountId = acct.id;
      await this.prisma.store.update({
        where: { id: store.id },
        data: { stripeAccountId: accountId },
      });
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: link.url, connected: false };
  }
}

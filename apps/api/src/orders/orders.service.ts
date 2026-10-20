import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import Stripe from 'stripe';

@Injectable()
export class OrdersService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  async getCustomerOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: {
        customerId: userId,
        status: { not: 'pending_payment' },
      },
      include: {
        store: { select: { id: true, name: true, slug: true, emoji: true, color: true } },
        window: true,
        driver: { select: { id: true, name: true, phone: true } },
        items: true,
      },
      orderBy: { id: 'desc' },
      take: 100,
    });

    return {
      orders: orders.map((o) => ({
        ...o,
        item_count: o.items.reduce((sum, it) => sum + it.qty, 0),
      })),
    };
  }

  async getOrderById(orderId: number, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        window: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true, vehicle: true } },
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        checkout: { select: { paymentMethod: true, paymentStatus: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Authorization checks
    const isAdmin = user.role === 'admin';
    const isCustomer = user.role === 'customer' && order.customerId === user.id;
    const isDriver = user.role === 'driver' && (order.driverId === user.id || (order.status === 'ready' && !order.driverId));
    let isMerchant = false;
    if (user.role === 'merchant') {
      const myStore = await this.prisma.store.findFirst({ where: { ownerId: user.id } });
      isMerchant = myStore ? myStore.id === order.storeId : false;
    }

    if (!isAdmin && !isCustomer && !isDriver && !isMerchant) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return {
      order: {
        ...order,
        item_count: order.items.reduce((sum, it) => sum + it.qty, 0),
      },
    };
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: userId },
      include: { items: true, checkout: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'placed') {
      throw new BadRequestException('Order cannot be cancelled — store has already begun preparing it');
    }

    // Trigger full refund
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

    // Restock items
    for (const it of order.items) {
      if (it.productId) {
        await this.prisma.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.qty } },
        });
      }
    }

    // Update status
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: 'cancelled',
        note: 'Cancelled by customer — 100% full refund issued',
        actor: 'customer',
      },
    });

    this.eventsGateway.emitOrderStatusUpdate({
      orderId: order.id,
      status: 'cancelled',
      storeId: order.storeId,
    });

    return { order: updated };
  }
}

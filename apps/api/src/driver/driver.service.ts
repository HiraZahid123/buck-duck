import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import Stripe from 'stripe';

@Injectable()
export class DriverService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  async getSummary(driverId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException('Driver not found');

    const delivered = await this.prisma.order.findMany({
      where: { driverId, status: 'delivered' },
    });

    const totalEarnings = delivered.reduce((acc, o) => acc + o.driverPayCents, 0);
    const totalTips = delivered.reduce((acc, o) => acc + o.tipCents, 0);

    const activeCount = await this.prisma.order.count({
      where: { driverId, status: { in: ['ready', 'picked_up'] } },
    });

    const availableCount = await this.prisma.order.count({
      where: { status: 'ready', driverId: null },
    });

    return {
      driver: {
        id: user.id,
        name: user.name,
        online: user.driverOnline,
        vehicle: user.vehicle,
      },
      totals: {
        deliveries: delivered.length,
        earnings: totalEarnings,
        tips: totalTips,
      },
      active: activeCount,
      available: availableCount,
      base_pay_cents: 550,
    };
  }

  async toggleOnline(driverId: number, online: boolean) {
    const user = await this.prisma.user.update({
      where: { id: driverId },
      data: { driverOnline: Boolean(online) },
    });
    return { online: user.driverOnline };
  }

  async getAvailableJobs() {
    const orders = await this.prisma.order.findMany({
      where: { status: 'ready', driverId: null },
      include: {
        store: true,
        window: true,
        items: true,
      },
      orderBy: { id: 'asc' },
      take: 50,
    });

    return {
      orders: orders.map((o) => ({
        ...o,
        item_count: o.items.reduce((sum, it) => sum + it.qty, 0),
      })),
    };
  }

  async getMyRoute(driverId: number) {
    const orders = await this.prisma.order.findMany({
      where: {
        driverId,
        status: { in: ['ready', 'picked_up'] },
      },
      include: {
        store: true,
        window: true,
        customer: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: [{ status: 'desc' }, { id: 'asc' }],
    });

    return {
      orders: orders.map((o) => ({
        ...o,
        item_count: o.items.reduce((sum, it) => sum + it.qty, 0),
      })),
    };
  }

  async claimJob(driverId: number, orderId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user || !user.driverOnline) {
      throw new BadRequestException('You must be online to claim delivery jobs');
    }

    const activeStops = await this.prisma.order.count({
      where: { driverId, status: { in: ['ready', 'picked_up'] } },
    });

    if (activeStops >= 12) {
      throw new BadRequestException('You have reached the 12-stop route limit');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, status: 'ready', driverId: null },
    });

    if (!order) {
      throw new ConflictException('Another driver already accepted this delivery');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { driverId: user.id },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: 'ready',
        note: `Driver ${user.name} claimed the delivery`,
        actor: 'driver',
      },
    });

    this.eventsGateway.emitOrderStatusUpdate({
      orderId: order.id,
      status: 'ready',
      driverId: user.id,
    });

    return { order: updated };
  }

  async releaseJob(driverId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, driverId, status: 'ready' },
    });

    if (!order) {
      throw new BadRequestException('Only un-collected orders can be released');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { driverId: null },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: 'ready',
        note: 'Driver released delivery back to job board',
        actor: 'driver',
      },
    });

    this.eventsGateway.emitOrderStatusUpdate({
      orderId: order.id,
      status: 'ready',
      driverId: null,
    });

    return { ok: true };
  }

  async updateStatus(
    driverId: number,
    orderId: number,
    nextStatus: string,
    proofNote?: string,
    photoUrl?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, driverId },
      include: { store: true },
    });

    if (!order) throw new NotFoundException('Delivery not found');

    const isValid =
      (order.status === 'ready' && nextStatus === 'picked_up') ||
      (order.status === 'picked_up' && nextStatus === 'delivered');

    if (!isValid) {
      throw new BadRequestException(`Invalid status transition to ${nextStatus}`);
    }

    if (nextStatus === 'delivered' && !proofNote) {
      throw new BadRequestException('A drop-off note (e.g. "Left at front door") is required');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        proofNote: proofNote || undefined,
        proofPhotoUrl: photoUrl || undefined,
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: nextStatus,
        note: nextStatus === 'picked_up' ? 'Driver confirmed pickup of BuckDuck bags' : `Delivered: ${proofNote}`,
        actor: 'driver',
      },
    });

    // If delivered, trigger Stripe Connect merchant payout transfer!
    if (nextStatus === 'delivered' && this.stripe && order.store.stripeAccountId && order.store.stripeChargesEnabled) {
      try {
        const transferAmount = order.subtotalCents - order.commissionCents;
        const transfer = await this.stripe.transfers.create({
          amount: transferAmount,
          currency: 'usd',
          destination: order.store.stripeAccountId,
          transfer_group: `checkout_${order.checkoutId}`,
          metadata: { order_number: order.number },
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: { transferId: transfer.id },
        });
      } catch (err) {
        console.error('Merchant payout transfer failed:', err.message);
      }
    }

    this.eventsGateway.emitOrderStatusUpdate({
      orderId: order.id,
      status: nextStatus,
      driverId,
      storeId: order.storeId,
    });

    return { order: updated };
  }

  async getHistory(driverId: number) {
    const orders = await this.prisma.order.findMany({
      where: { driverId, status: 'delivered' },
      include: { store: true, window: true },
      orderBy: { updatedAt: 'desc' },
      take: 60,
    });

    return { orders };
  }
}

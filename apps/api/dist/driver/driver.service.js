"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const stripe_1 = require("stripe");
let DriverService = class DriverService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.stripe = null;
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        }
    }
    async getSummary(driverId) {
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user)
            throw new common_1.NotFoundException('Driver not found');
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
    async toggleOnline(driverId, online) {
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
    async getMyRoute(driverId) {
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
    async claimJob(driverId, orderId) {
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user || !user.driverOnline) {
            throw new common_1.BadRequestException('You must be online to claim delivery jobs');
        }
        const activeStops = await this.prisma.order.count({
            where: { driverId, status: { in: ['ready', 'picked_up'] } },
        });
        if (activeStops >= 12) {
            throw new common_1.BadRequestException('You have reached the 12-stop route limit');
        }
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, status: 'ready', driverId: null },
        });
        if (!order) {
            throw new common_1.ConflictException('Another driver already accepted this delivery');
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
    async releaseJob(driverId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, driverId, status: 'ready' },
        });
        if (!order) {
            throw new common_1.BadRequestException('Only un-collected orders can be released');
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
    async updateStatus(driverId, orderId, nextStatus, proofNote, photoUrl) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, driverId },
            include: { store: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Delivery not found');
        const isValid = (order.status === 'ready' && nextStatus === 'picked_up') ||
            (order.status === 'picked_up' && nextStatus === 'delivered');
        if (!isValid) {
            throw new common_1.BadRequestException(`Invalid status transition to ${nextStatus}`);
        }
        if (nextStatus === 'delivered' && !proofNote) {
            throw new common_1.BadRequestException('A drop-off note (e.g. "Left at front door") is required');
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
            }
            catch (err) {
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
    async getHistory(driverId) {
        const orders = await this.prisma.order.findMany({
            where: { driverId, status: 'delivered' },
            include: { store: true, window: true },
            orderBy: { updatedAt: 'desc' },
            take: 60,
        });
        return { orders };
    }
};
exports.DriverService = DriverService;
exports.DriverService = DriverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], DriverService);
//# sourceMappingURL=driver.service.js.map
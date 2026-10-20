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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const stripe_1 = require("stripe");
let AdminService = class AdminService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.stripe = null;
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        }
    }
    async getOverview() {
        const liveStatuses = ['placed', 'accepted', 'packing', 'ready', 'picked_up', 'delivered'];
        const orders = await this.prisma.order.findMany({
            where: { status: { in: liveStatuses } },
            include: { store: true, window: true },
        });
        const gmv = orders.reduce((sum, o) => sum + o.totalCents, 0);
        const netRevenue = orders.reduce((sum, o) => sum + (o.commissionCents + o.serviceFeeCents + o.deliveryFeeCents - (o.driverPayCents - o.tipCents)), 0);
        const aov = orders.length ? Math.round(gmv / orders.length) : 0;
        const customersCount = await this.prisma.user.count({ where: { role: 'customer' } });
        const storesActiveCount = await this.prisma.store.count({ where: { status: 'active' } });
        const storesPendingCount = await this.prisma.store.count({ where: { status: 'pending' } });
        const driversCount = await this.prisma.user.count({ where: { role: 'driver' } });
        const driversOnlineCount = await this.prisma.user.count({ where: { role: 'driver', driverOnline: true } });
        const unassignedReadyCount = await this.prisma.order.count({ where: { status: 'ready', driverId: null } });
        const statusCounts = {};
        for (const st of ['placed', 'accepted', 'packing', 'ready', 'picked_up', 'delivered']) {
            statusCounts[st] = orders.filter((o) => o.status === st).length;
        }
        return {
            totals: {
                orders: orders.length,
                gmv,
                net_revenue: netRevenue,
                aov,
            },
            counts: {
                customers: customersCount,
                stores: storesActiveCount,
                pending_stores: storesPendingCount,
                drivers: driversCount,
                drivers_online: driversOnlineCount,
                unassigned_ready: unassignedReadyCount,
            },
            statuses: statusCounts,
        };
    }
    async getStores() {
        const stores = await this.prisma.store.findMany({
            include: {
                owner: { select: { name: true, email: true } },
                _count: { select: { products: { where: { active: true } }, orders: true } },
            },
            orderBy: [{ status: 'asc' }, { name: 'asc' }],
        });
        return {
            stores: stores.map((s) => ({
                ...s,
                owner_name: s.owner?.name,
                owner_email: s.owner?.email,
                product_count: s._count.products,
                total_orders: s._count.orders,
            })),
        };
    }
    async updateStore(storeId, body) {
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        const commissionRate = body.commission_rate !== undefined
            ? Math.max(0, Math.min(0.5, Number(body.commission_rate)))
            : store.commissionRate;
        const updated = await this.prisma.store.update({
            where: { id: store.id },
            data: {
                status: body.status || store.status,
                commissionRate,
            },
        });
        return { store: updated };
    }
    async getUsers(role, query) {
        const where = {};
        if (role)
            where.role = role;
        if (query?.trim()) {
            where.OR = [
                { name: { contains: query.trim() } },
                { email: { contains: query.trim() } },
            ];
        }
        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                status: true,
                driverOnline: true,
                vehicle: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        return { users };
    }
    async updateUserStatus(userId, status) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status },
            select: { id: true, name: true, email: true, role: true, status: true },
        });
        return { user };
    }
    async getOrders(status, q) {
        const where = { status: { not: 'pending_payment' } };
        if (status)
            where.status = status;
        if (q?.trim()) {
            where.OR = [
                { number: { contains: q.trim() } },
                { customer: { name: { contains: q.trim() } } },
                { store: { name: { contains: q.trim() } } },
            ];
        }
        const orders = await this.prisma.order.findMany({
            where,
            include: {
                customer: { select: { name: true, email: true, phone: true } },
                store: { select: { name: true, phone: true, address: true } },
                driver: { select: { id: true, name: true, phone: true } },
                window: true,
                items: true,
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
    async updateOrder(orderId, body) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const updateData = {};
        if (body.driver_id !== undefined) {
            updateData.driverId = body.driver_id ? Number(body.driver_id) : null;
        }
        if (body.status) {
            updateData.status = body.status;
        }
        const updated = await this.prisma.order.update({
            where: { id: order.id },
            data: updateData,
        });
        await this.prisma.orderEvent.create({
            data: {
                orderId: order.id,
                status: body.status || order.status,
                note: body.note || (body.driver_id ? `Assigned to driver by admin` : 'Order modified by admin operations'),
                actor: 'admin',
            },
        });
        this.eventsGateway.emitOrderStatusUpdate({
            orderId: order.id,
            status: updated.status,
            driverId: updated.driverId,
            storeId: order.storeId,
        });
        return { order: updated };
    }
    async refundOrder(orderId, amountCents, reason) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { checkout: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const refundAmount = amountCents ? Math.min(amountCents, order.totalCents) : order.totalCents;
        if (this.stripe && order.checkout?.paymentIntentId) {
            try {
                await this.stripe.refunds.create({
                    payment_intent: order.checkout.paymentIntentId,
                    amount: refundAmount,
                });
            }
            catch (err) {
                console.error('Stripe refund failed:', err.message);
            }
        }
        const isFull = refundAmount >= order.totalCents;
        const updated = await this.prisma.order.update({
            where: { id: order.id },
            data: {
                status: isFull ? 'refunded' : order.status,
            },
        });
        await this.prisma.orderEvent.create({
            data: {
                orderId: order.id,
                status: isFull ? 'refunded' : order.status,
                note: `Refund issued: $${(refundAmount / 100).toFixed(2)} — ${reason || 'Admin customer service'}`,
                actor: 'admin',
            },
        });
        return { order: updated };
    }
    async getDrivers() {
        const drivers = await this.prisma.user.findMany({
            where: { role: 'driver' },
            include: {
                _count: {
                    select: {
                        deliveries: { where: { status: 'delivered' } },
                    },
                },
            },
            orderBy: [{ driverOnline: 'desc' }, { name: 'asc' }],
        });
        return {
            drivers: drivers.map((d) => ({
                id: d.id,
                name: d.name,
                email: d.email,
                phone: d.phone,
                vehicle: d.vehicle,
                status: d.status,
                driver_online: d.driverOnline,
                deliveries_count: d._count.deliveries,
            })),
        };
    }
    async getSettings() {
        const settings = await this.prisma.setting.findMany();
        const map = {
            delivery_fee_cents: '599',
            service_fee_rate: '0.05',
            service_fee_min_cents: '199',
            driver_base_pay_cents: '550',
            min_order_cents: '1500',
            order_cutoff_hours: '24',
        };
        for (const s of settings) {
            map[s.key] = s.value;
        }
        return { settings: map };
    }
    async updateSettings(body) {
        for (const [key, value] of Object.entries(body)) {
            await this.prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            });
        }
        return this.getSettings();
    }
    async getFinance() {
        const delivered = await this.prisma.order.findMany({
            where: { status: 'delivered' },
            include: { window: true },
        });
        const gmv = delivered.reduce((acc, o) => acc + o.totalCents, 0);
        const merchandise = delivered.reduce((acc, o) => acc + o.subtotalCents, 0);
        const commissions = delivered.reduce((acc, o) => acc + o.commissionCents, 0);
        const deliveryFees = delivered.reduce((acc, o) => acc + o.deliveryFeeCents, 0);
        const serviceFees = delivered.reduce((acc, o) => acc + o.serviceFeeCents, 0);
        const driverPay = delivered.reduce((acc, o) => acc + o.driverPayCents, 0);
        const merchantPayouts = merchandise - commissions;
        const netRevenue = commissions + deliveryFees + serviceFees - driverPay;
        return {
            totals: {
                gmv,
                merchandise,
                commissions,
                delivery_fees: deliveryFees,
                service_fees: serviceFees,
                driver_pay: driverPay,
                merchant_payouts: merchantPayouts,
                net_revenue: netRevenue,
            },
            delivered_count: delivered.length,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], AdminService);
//# sourceMappingURL=admin.service.js.map
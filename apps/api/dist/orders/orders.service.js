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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const stripe_1 = require("stripe");
let OrdersService = class OrdersService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.stripe = null;
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        }
    }
    async getCustomerOrders(userId) {
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
    async getOrderById(orderId, user) {
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
            throw new common_1.NotFoundException('Order not found');
        }
        const isAdmin = user.role === 'admin';
        const isCustomer = user.role === 'customer' && order.customerId === user.id;
        const isDriver = user.role === 'driver' && (order.driverId === user.id || (order.status === 'ready' && !order.driverId));
        let isMerchant = false;
        if (user.role === 'merchant') {
            const myStore = await this.prisma.store.findFirst({ where: { ownerId: user.id } });
            isMerchant = myStore ? myStore.id === order.storeId : false;
        }
        if (!isAdmin && !isCustomer && !isDriver && !isMerchant) {
            throw new common_1.ForbiddenException('You do not have access to this order');
        }
        return {
            order: {
                ...order,
                item_count: order.items.reduce((sum, it) => sum + it.qty, 0),
            },
        };
    }
    async cancelOrder(orderId, userId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, customerId: userId },
            include: { items: true, checkout: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== 'placed') {
            throw new common_1.BadRequestException('Order cannot be cancelled — store has already begun preparing it');
        }
        if (this.stripe && order.checkout?.paymentIntentId) {
            try {
                await this.stripe.refunds.create({
                    payment_intent: order.checkout.paymentIntentId,
                    amount: order.totalCents,
                });
            }
            catch (err) {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map
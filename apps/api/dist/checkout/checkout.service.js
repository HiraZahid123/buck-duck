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
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const stripe_1 = require("stripe");
let CheckoutService = class CheckoutService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.stripe = null;
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        }
    }
    async calculateQuote(items, tipCents = 0) {
        if (!items || !items.length) {
            throw new common_1.BadRequestException('Your cart is empty');
        }
        const deliveryFeePerStore = 599;
        const serviceFeeRate = 0.05;
        const serviceFeeMin = 199;
        const driverBasePay = 550;
        const minOrderCents = 1500;
        const byStore = new Map();
        for (const it of items) {
            const qty = Math.max(1, Math.min(99, Math.floor(it.qty || 1)));
            const product = await this.prisma.product.findUnique({
                where: { id: it.product_id },
                include: { store: true },
            });
            if (!product || !product.active) {
                throw new common_1.BadRequestException('An item in your cart is no longer available');
            }
            if (product.store.status !== 'active') {
                throw new common_1.BadRequestException(`${product.store.name} is not accepting orders right now`);
            }
            if (product.stock < qty) {
                throw new common_1.BadRequestException(`Only ${product.stock} left of ${product.name}`);
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
    async createCheckout(userId, body) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const quote = await this.calculateQuote(body.items, body.tip_cents);
        if (quote.subtotal_cents < quote.min_order_cents) {
            throw new common_1.BadRequestException(`Minimum order is $${(quote.min_order_cents / 100).toFixed(2)}`);
        }
        const window = await this.prisma.deliveryWindow.findUnique({ where: { id: body.window_id } });
        if (!window || !window.active) {
            throw new common_1.BadRequestException('Please choose a valid active delivery window');
        }
        const addr = body.address || {
            line1: '8401 Colesville Rd',
            line2: '',
            city: 'Silver Spring',
            state: 'MD',
            zip: '20910',
        };
        const phone = body.phone?.trim() || user.phone || '(301) 555-0199';
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
                        create: g.items.map((it) => ({
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
    async confirmCheckout(userId, checkoutId, paymentMethod = 'card') {
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
            throw new common_1.NotFoundException('Checkout not found');
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
                for (const it of order.items) {
                    if (it.productId) {
                        await this.prisma.product.update({
                            where: { id: it.productId },
                            data: { stock: { decrement: it.qty } },
                        });
                    }
                }
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
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map
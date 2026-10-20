import { CheckoutService } from './checkout.service';
export declare class CheckoutController {
    private checkoutService;
    constructor(checkoutService: CheckoutService);
    quote(body: {
        items: Array<{
            product_id: number;
            qty: number;
        }>;
        tip_cents?: number;
    }): Promise<{
        subtotal_cents: number;
        delivery_fee_cents: number;
        service_fee_cents: number;
        tip_cents: number;
        total_cents: number;
        min_order_cents: number;
        stores: {
            store_id: any;
            store_name: any;
            subtotal_cents: any;
            delivery_fee_cents: any;
            service_fee_cents: any;
            bags: any;
        }[];
        groups: any[];
    }>;
    checkout(userId: number, body: any): Promise<{
        checkout_id: number;
        client_secret: string;
        amount_cents: number;
        order_ids: any[];
        mode: string;
    }>;
    confirm(userId: number, checkoutId: string, paymentMethod?: string): Promise<{
        ok: boolean;
        orders: ({
            store: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                phone: string | null;
                status: string;
                slug: string;
                ownerId: number;
                tagline: string | null;
                category: string;
                address: string | null;
                city: string;
                state: string;
                zip: string;
                color: string;
                emoji: string;
                logoUrl: string | null;
                commissionRate: number;
                stripeAccountId: string | null;
                stripeChargesEnabled: boolean;
                rating: number;
            };
            window: {
                label: string;
                id: number;
                date: string;
                startTime: string;
                endTime: string;
                capacity: number;
                active: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            items: {
                id: number;
                name: string;
                emoji: string | null;
                priceCents: number;
                unit: string | null;
                qty: number;
                productId: number | null;
                orderId: number;
            }[];
        } & {
            number: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            status: string;
            city: string | null;
            state: string | null;
            zip: string | null;
            storeId: number;
            bags: number;
            totalCents: number;
            customerId: number;
            subtotalCents: number;
            deliveryFeeCents: number;
            serviceFeeCents: number;
            taxCents: number;
            tipCents: number;
            commissionCents: number;
            driverPayCents: number;
            addressLine1: string | null;
            addressLine2: string | null;
            notes: string | null;
            proofNote: string | null;
            proofPhotoUrl: string | null;
            transferId: string | null;
            checkoutId: number | null;
            windowId: number;
            driverId: number | null;
        })[];
    }>;
}

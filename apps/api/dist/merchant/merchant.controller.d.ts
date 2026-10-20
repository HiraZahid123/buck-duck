import { MerchantService } from './merchant.service';
export declare class MerchantController {
    private merchantService;
    constructor(merchantService: MerchantService);
    getSummary(userId: number): Promise<{
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
        counts: Record<string, number>;
        bags_needed: number;
        totals: {
            orders: number;
            sales: number;
            payout: number;
        };
        low_stock: {
            id: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            emoji: string | null;
            storeId: number;
            priceCents: number;
            unit: string | null;
            stock: number;
            imageUrl: string | null;
        }[];
    }>;
    getStore(userId: number): Promise<{
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
    }>;
    updateStore(userId: number, body: any): Promise<{
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
    }>;
    getProducts(userId: number): Promise<{
        products: {
            id: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            emoji: string | null;
            storeId: number;
            priceCents: number;
            unit: string | null;
            stock: number;
            imageUrl: string | null;
        }[];
    }>;
    createProduct(userId: number, body: any): Promise<{
        product: {
            id: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            emoji: string | null;
            storeId: number;
            priceCents: number;
            unit: string | null;
            stock: number;
            imageUrl: string | null;
        };
    }>;
    updateProduct(userId: number, id: string, body: any): Promise<{
        product: {
            id: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            emoji: string | null;
            storeId: number;
            priceCents: number;
            unit: string | null;
            stock: number;
            imageUrl: string | null;
        };
    }>;
    deleteProduct(userId: number, id: string): Promise<{
        ok: boolean;
    }>;
    getOrders(userId: number, status?: string): Promise<{
        orders: {
            item_count: number;
            customer: {
                name: string;
                phone: string;
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
        }[];
    }>;
    updateOrderStatus(userId: number, orderId: string, nextStatus: string, bags?: number, note?: string): Promise<{
        order: {
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
        };
    }>;
    getPayouts(userId: number): Promise<{
        store: {
            id: number;
            commission_rate: number;
            stripe_account_id: string;
            stripe_charges_enabled: boolean;
        };
        orders: ({
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
        pending_cents: number;
        payments_mode: string;
    }>;
    stripeOnboard(userId: number, returnUrl?: string): Promise<{
        url: string;
        connected: boolean;
    }>;
}

import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getOverview(): Promise<{
        totals: {
            orders: number;
            gmv: number;
            net_revenue: number;
            aov: number;
        };
        counts: {
            customers: number;
            stores: number;
            pending_stores: number;
            drivers: number;
            drivers_online: number;
            unassigned_ready: number;
        };
        statuses: Record<string, number>;
    }>;
    getStores(): Promise<{
        stores: {
            owner_name: string;
            owner_email: string;
            product_count: number;
            total_orders: number;
            _count: {
                orders: number;
                products: number;
            };
            owner: {
                name: string;
                email: string;
            };
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
        }[];
    }>;
    updateStore(storeId: string, body: any): Promise<{
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
    getUsers(role?: string, q?: string): Promise<{
        users: {
            id: number;
            createdAt: Date;
            name: string;
            email: string;
            role: string;
            phone: string;
            status: string;
            driverOnline: boolean;
            vehicle: string;
        }[];
    }>;
    updateUserStatus(userId: string, status: string): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
            status: string;
        };
    }>;
    getOrders(status?: string, q?: string): Promise<{
        orders: {
            item_count: number;
            store: {
                name: string;
                phone: string;
                address: string;
            };
            customer: {
                name: string;
                email: string;
                phone: string;
            };
            driver: {
                id: number;
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
    updateOrder(orderId: string, body: any): Promise<{
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
    refundOrder(orderId: string, amountCents?: number, reason?: string): Promise<{
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
    getDrivers(): Promise<{
        drivers: {
            id: number;
            name: string;
            email: string;
            phone: string;
            vehicle: string;
            status: string;
            driver_online: boolean;
            deliveries_count: number;
        }[];
    }>;
    getSettings(): Promise<{
        settings: Record<string, string>;
    }>;
    updateSettings(body: Record<string, string>): Promise<{
        settings: Record<string, string>;
    }>;
    getFinance(): Promise<{
        totals: {
            gmv: number;
            merchandise: number;
            commissions: number;
            delivery_fees: number;
            service_fees: number;
            driver_pay: number;
            merchant_payouts: number;
            net_revenue: number;
        };
        delivered_count: number;
    }>;
}

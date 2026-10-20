import { StoresService } from './stores.service';
export declare class StoresController {
    private storesService;
    constructor(storesService: StoresService);
    findAll(q?: string, category?: string): Promise<{
        stores: {
            product_count: number;
            _count: {
                products: number;
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
        categories: string[];
    }>;
    findBySlug(slug: string): Promise<{
        store: {
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
        } & {
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
}

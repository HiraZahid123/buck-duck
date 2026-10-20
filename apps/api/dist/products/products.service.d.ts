import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    search(q: string): Promise<{
        products: {
            id: number;
            name: string;
            category: string;
            price_cents: number;
            unit: string;
            stock: number;
            emoji: string;
            image_url: string;
            store_id: number;
            store_name: string;
            store_slug: string;
        }[];
    }>;
}

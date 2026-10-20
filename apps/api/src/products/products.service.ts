import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async search(q: string) {
    if (!q || !q.trim()) return { products: [] };
    const query = q.trim();

    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        store: { status: 'active' },
        OR: [
          { name: { contains: query } },
          { category: { contains: query } },
          { description: { contains: query } },
        ],
      },
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
      take: 60,
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price_cents: p.priceCents,
        unit: p.unit,
        stock: p.stock,
        emoji: p.emoji,
        image_url: p.imageUrl,
        store_id: p.store.id,
        store_name: p.store.name,
        store_slug: p.store.slug,
      })),
    };
  }
}

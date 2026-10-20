import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { q?: string; category?: string }) {
    const where: any = { status: 'active' };
    if (query.category) {
      where.category = query.category;
    }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { description: { contains: query.q } },
        { tagline: { contains: query.q } },
      ];
    }

    const stores = await this.prisma.store.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
    });

    const categoriesRaw = await this.prisma.store.findMany({
      where: { status: 'active' },
      select: { category: true },
      distinct: ['category'],
    });

    return {
      stores: stores.map((s) => ({
        ...s,
        product_count: s._count.products,
      })),
      categories: categoriesRaw.map((c) => c.category),
    };
  }

  async findBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        products: {
          where: { active: true },
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!store || store.status !== 'active') {
      throw new NotFoundException('Store not found or inactive');
    }

    return {
      store,
      products: store.products,
    };
  }
}

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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(q) {
        if (!q || !q.trim())
            return { products: [] };
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map
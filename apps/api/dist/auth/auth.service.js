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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(data) {
        const email = data.email?.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new common_1.BadRequestException('A valid email address is required');
        }
        if (!data.password || data.password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        }
        if (!data.name?.trim()) {
            throw new common_1.BadRequestException('Name is required');
        }
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const role = ['customer', 'merchant', 'driver'].includes(data.role) ? data.role : 'customer';
        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                name: data.name.trim(),
                role,
                phone: data.phone?.trim() || null,
                vehicle: role === 'driver' ? data.vehicle?.trim() || null : null,
                status: 'active',
            },
        });
        if (role === 'merchant') {
            const storeName = data.store_name?.trim() || `${data.name}'s Store`;
            let slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';
            let count = 1;
            while (await this.prisma.store.findUnique({ where: { slug } })) {
                slug = `${slug}-${++count}`;
            }
            await this.prisma.store.create({
                data: {
                    ownerId: user.id,
                    name: storeName,
                    slug,
                    category: data.category?.trim() || 'Groceries',
                    city: 'Silver Spring',
                    state: 'MD',
                    zip: '20910',
                    status: 'pending',
                    commissionRate: 0.15,
                },
            });
        }
        const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
        return { token, user: this.sanitizeUser(user) };
    }
    async login(data) {
        const email = data.email?.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Incorrect email or password');
        }
        const isMatch = await bcrypt.compare(data.password || '', user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Incorrect email or password');
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Your account has been suspended. Please contact support.');
        }
        const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
        return { token, user: this.sanitizeUser(user) };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const out = { user: this.sanitizeUser(user) };
        if (user.role === 'merchant') {
            out.store = await this.prisma.store.findFirst({ where: { ownerId: user.id } });
        }
        return out;
    }
    async updateMe(userId, body) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: body.name?.trim() || undefined,
                phone: body.phone?.trim() !== undefined ? body.phone.trim() : undefined,
                vehicle: body.vehicle?.trim() !== undefined ? body.vehicle.trim() : undefined,
            },
        });
        return { user: this.sanitizeUser(user) };
    }
    sanitizeUser(user) {
        const { passwordHash, ...safe } = user;
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
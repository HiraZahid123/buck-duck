import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
    vehicle?: string;
    store_name?: string;
    category?: string;
  }) {
    const email = data.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required');
    }
    if (!data.password || data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (!data.name?.trim()) {
      throw new BadRequestException('Name is required');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
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
          status: 'pending', // pending admin approval per BRD
          commissionRate: 0.15,
        },
      });
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitizeUser(user) };
  }

  async login(data: { email: string; password: string }) {
    const email = data.email?.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const isMatch = await bcrypt.compare(data.password || '', user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitizeUser(user) };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const out: any = { user: this.sanitizeUser(user) };
    if (user.role === 'merchant') {
      out.store = await this.prisma.store.findFirst({ where: { ownerId: user.id } });
    }
    return out;
  }

  async updateMe(userId: number, body: { name?: string; phone?: string; vehicle?: string }) {
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

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(data: {
        email: string;
        password: string;
        name: string;
        role?: string;
        phone?: string;
        vehicle?: string;
        store_name?: string;
        category?: string;
    }): Promise<{
        token: string;
        user: any;
    }>;
    login(data: {
        email: string;
        password: string;
    }): Promise<{
        token: string;
        user: any;
    }>;
    getMe(userId: number): Promise<any>;
    updateMe(userId: number, body: {
        name?: string;
        phone?: string;
        vehicle?: string;
    }): Promise<{
        user: any;
    }>;
    private sanitizeUser;
}

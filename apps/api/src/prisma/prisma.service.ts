import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      console.log('[Prisma] Connecting to database...');
      await this.$connect();
      console.log('[Prisma] Successfully connected to database.');
    } catch (err: any) {
      console.error('[Prisma Error] Failed to connect to database:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {}
  }
}

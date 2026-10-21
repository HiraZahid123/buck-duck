import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getNormalizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes('-pooler') && !url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}pgbouncer=true&connect_timeout=15`;
  }
  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = getNormalizedDatabaseUrl();
    super(url ? { datasources: { db: { url } } } : undefined);
  }

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

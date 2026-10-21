import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getNormalizedDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;

  // Search fallback .env paths if not present in process.env
  if (!url) {
    try {
      const fs = require('fs');
      const path = require('path');
      const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../../../.env'),
        path.resolve(process.cwd(), '../../../config/.env'),
        '/home/u595725627/domains/buckduck.hirazahid.com/hbuilds/config/.env',
        '/home/u595725627/domains/buckduck.hirazahid.com/public_html/.env',
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          require('dotenv').config({ path: c });
          if (process.env.DATABASE_URL) {
            url = process.env.DATABASE_URL;
            break;
          }
        }
      }
    } catch {}
  }

  // Neon default fallback to guarantee connection even if environment injection fails
  if (!url) {
    url = 'postgresql://neondb_owner:npg_uwgqFW46ryYb@ep-damp-term-b4kxob0n-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  }

  // Strip single or double quotes Hostinger might wrap around the value
  url = url.replace(/^['"]|['"]$/g, '').trim();

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

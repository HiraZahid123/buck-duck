import { Controller, Get } from '@nestjs/common';
import { WindowsService } from './windows/windows.service';
import { PrismaService } from './prisma/prisma.service';

@Controller('api')
export class AppController {
  constructor(
    private windowsService: WindowsService,
    private prisma: PrismaService,
  ) {}

  @Get('config')
  async getConfig() {
    const windowsData = await this.windowsService.getWindows();
    const nextOpen = windowsData.windows.find((w) => w.open) || windowsData.windows[0] || null;

    return {
      brand: 'BuckDuck',
      marketplace: 'StoreFront USA',
      pilot_zone: 'Silver Spring, MD (Eastern Time)',
      demo: process.env.DEMO_MODE === 'true',
      delivery_weekday: 6, // Saturday
      delivery_fee_cents: 599,
      service_fee_rate: 0.05,
      min_order_cents: 1500,
      next_window: nextOpen,
      payments: {
        mode: process.env.STRIPE_SECRET_KEY ? 'stripe' : 'demo',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        country: 'US',
        currency: 'usd',
      },
    };
  }

  @Get('healthz')
  getHealth() {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  @Get('debug')
  async getDebug() {
    let dbStatus = 'unknown';
    let dbError = null;
    let storeCount = 0;
    try {
      storeCount = await this.prisma.store.count();
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = 'error';
      dbError = err.message;
    }

    const dbUrl = process.env.DATABASE_URL || '';
    const safeUrl = dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'NOT_SET';

    return {
      server: 'NestJS Backend',
      status: 'online',
      port: process.env.API_PORT || 4000,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        storesInDb: storeCount,
        error: dbError,
        connectionStringConfigured: !!dbUrl,
        connectionStringMasked: safeUrl,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DEMO_MODE: process.env.DEMO_MODE,
      },
      nodeVersion: process.version,
    };
  }
}


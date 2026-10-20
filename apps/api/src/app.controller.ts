import { Controller, Get } from '@nestjs/common';
import { WindowsService } from './windows/windows.service';

@Controller('api')
export class AppController {
  constructor(private windowsService: WindowsService) {}

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
}

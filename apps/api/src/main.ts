import * as dotenv from 'dotenv';
import * as path from 'path';

import * as fs from 'fs';

try {
  const envPaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../../../.env'),
    path.resolve(__dirname, '../../../../config/.env'),
    path.resolve(__dirname, '../../../../../config/.env'),
    '/home/u595725627/domains/buckduck.hirazahid.com/hbuilds/config/.env',
    '/home/u595725627/domains/buckduck.hirazahid.com/public_html/.env',
  ];
  for (const ep of envPaths) {
    if (fs.existsSync(ep)) {
      dotenv.config({ path: ep });
    }
  }
  dotenv.config();
} catch {}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.API_PORT) || 4000;
  const http = await import('http');

  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await app.listen(port, '0.0.0.0');
      console.log(`🦆 BuckDuck NestJS API is listening on http://0.0.0.0:${port}`);
      return;
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        // Probe if an active instance is truly responding on port 4000
        const isResponding = await new Promise<boolean>((resolve) => {
          const req = http.get(`http://127.0.0.1:${port}/api/healthz`, (res) => {
            resolve(res.statusCode === 200);
          });
          req.on('error', () => resolve(false));
          req.setTimeout(500, () => {
            req.destroy();
            resolve(false);
          });
        });

        if (isResponding) {
          console.log(`[NestJS] Confirmed active backend responding on port ${port}; standby worker exiting.`);
          return;
        }

        console.warn(`[NestJS] Port ${port} busy (attempt ${attempt}/${maxAttempts}). Socket lingering; retrying in 600ms...`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      throw err;
    }
  }

  throw new Error(`[NestJS] Could not bind to port ${port} after ${maxAttempts} attempts.`);
}

bootstrap().catch((err) => {
  console.error('[NestJS Fatal Error during bootstrap]', err);
  process.exit(1);
});

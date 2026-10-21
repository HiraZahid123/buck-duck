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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.API_PORT || 4000;
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`🦆 BuckDuck NestJS API is listening on http://0.0.0.0:${port}`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.log(`[NestJS] Port ${port} is already bound by an active backend instance; continuing cleanly.`);
      return;
    }
    throw err;
  }
}

bootstrap().catch((err) => {
  console.error('[NestJS Fatal Error during bootstrap]', err);
  process.exit(1);
});

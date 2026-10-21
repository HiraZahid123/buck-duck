import * as dotenv from 'dotenv';
import * as path from 'path';

try {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
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
  await app.listen(port, '0.0.0.0');
  console.log(`🦆 BuckDuck NestJS API is listening on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error('[NestJS Fatal Error during bootstrap]', err);
  process.exit(1);
});

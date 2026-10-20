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
  await app.listen(port);
  console.log(`🦆 BuckDuck NestJS API is listening on http://localhost:${port}`);
}

bootstrap();

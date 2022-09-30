import { NestFactory } from '@nestjs/core';
import { env } from 'process';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://testna.app.scv.si',
      'https://app.scv.si',
      'http://localhost:3000',
    ],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  await app.listen(env.PORT || 5050);
}
bootstrap();

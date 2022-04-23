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
    origin: `${
      env.OAUTH_REDIRECT_URI == 'http://localhost:5050/auth/redirect/'
        ? 'http://localhost:3000'
        : 'https://app.scv.si'
    }`,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  await app.listen(env.PORT || 5050);
}
bootstrap();

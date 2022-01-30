import { NestFactory } from '@nestjs/core';
import { env } from 'process';
import { json } from 'stream/consumers';
import { AppModule } from './app.module';
import * as dotenv from "dotenv"

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:`${env.OAUTH_REDIRECT_URI == "http://localhost:5050/auth/redirect/" ? "http://localhost:3000" : "http://app.scv.si"}`,
    credentials:true,
  })
  await app.listen(env.PORT ||5050);
}
bootstrap();

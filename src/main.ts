import { NestFactory } from '@nestjs/core';
import { env } from 'process';
import { json } from 'stream/consumers';
import { AppModule } from './app.module';
import * as dotenv from "dotenv"

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    { bodyParser: false, cors:true}
    );


  await app.listen(env.PORT ||5050);
}
bootstrap();

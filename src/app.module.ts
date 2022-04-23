import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { TokenModule } from './token/token.module';
import { UserMiddleware } from './user/user.middleware';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [AuthModule, CommonModule, TokenModule, UserModule, SearchModule],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('user', 'search');
  }
}

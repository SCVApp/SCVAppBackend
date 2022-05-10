import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { TokenModule } from './token/token.module';
import { UserMiddleware } from './user/user.middleware';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import * as dotenv from 'dotenv';
import { AdminMiddleware } from './admin/admin.middleware';

dotenv.config();

@Module({
  imports: [
    AuthModule,
    CommonModule,
    TokenModule,
    UserModule,
    SearchModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserMiddleware)
      .exclude(
        { path: 'user/logoutUrl', method: RequestMethod.GET },
        { path: 'user/logout', method: RequestMethod.GET },
      )
      .forRoutes('user', 'search');
    consumer.apply(AdminMiddleware).forRoutes('admin');
  }
}

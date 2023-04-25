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
import { UserMiddleware } from './user/middleware/user.middleware';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import * as dotenv from 'dotenv';
import { AdminMiddleware } from './admin/middleware/admin.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketModule } from './ticket/ticket.module';
import { MailModule } from './mail/mail.module';
import { PassModule } from './pass/pass.module';
import { DoorPassMiddleware } from './pass/middleware/doorPass.middleware';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/configuration';

dotenv.config();

@Module({
  imports: [
    AuthModule,
    CommonModule,
    TokenModule,
    UserModule,
    SearchModule,
    AdminModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      entities: [],
      synchronize: true,
    }),
    TicketModule,
    MailModule,
    PassModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
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
        { path: 'user/schedule', method: RequestMethod.POST },
      )
      .forRoutes(
        'user',
        'search',
        { path: 'pass/open_door/:code', method: RequestMethod.GET },
        {
          path: 'pass/get_door/:code',
          method: RequestMethod.GET,
        },
      );
    consumer
      .apply(AdminMiddleware)
      .exclude(
        { path: 'pass/open_door/:code', method: RequestMethod.GET },
        { path: 'pass/get_door/:code', method: RequestMethod.GET },
        { path: 'pass/door/is_opened', method: RequestMethod.GET },
      )
      .forRoutes('admin', 'pass');

    consumer.apply(DoorPassMiddleware).forRoutes('pass/door/is_opened', {
      path: 'user/schedule',
      method: RequestMethod.POST,
    });
  }
}

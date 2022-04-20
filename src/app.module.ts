import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { SessionModule } from 'nestjs-session';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { SearchController } from './search/seacrh.controller';
import { SearchSerivce } from './search/search.service';
import { env } from 'process';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMConfigService } from './db/typeorm.service';
import { User_Tracer } from './db/entity/user.entity';
import { DBService } from './db/db.service';
import { async } from 'rxjs';
import { getConnectionOptions } from 'typeorm';
import { Trace } from './db/entity/trace.entity';
import { TraceEvent } from './db/entity/traceEvent.entity';

@Module({
  imports: [
    SessionModule.forRoot({
      session: {
        secret: `${env.SESSION_SECRET}`,
        cookie: {
          domain: `${
            env.OAUTH_REDIRECT_URI === 'http://localhost:5050/auth/redirect/'
              ? 'localhost'
              : 'app.scv.si'
          }`,
        },
      },
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeORMConfigService,
    }),
    TypeOrmModule.forFeature([User_Tracer, Trace, TraceEvent]),
  ],
  controllers: [
    AppController,
    LoginController,
    UserController,
    SearchController,
  ],
  providers: [LoginService, UserService, SearchSerivce, DBService],
})
export class AppModule {}

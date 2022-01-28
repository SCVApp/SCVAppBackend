import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { SessionModule } from 'nestjs-session';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { SearchController } from './search/seacrh.controller';
import { SearchSerivce } from './search/search.service';
import { env } from 'process';


@Module({
  imports: [
    SessionModule.forRoot({
      session: {
        secret:`${env.SESSION_SECRET}`,
        resave: true,
        saveUninitialized: true,
      }
    })
  ],
  controllers: [AppController,LoginController,UserController,SearchController],
  providers: [AppService,LoginService,UserService,SearchSerivce],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { TokenModule } from 'src/token/token.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';
import { NotificationModule } from 'src/notification/notification.module';

dotenv.config();

@Module({
  imports: [CommonModule, TokenModule, NotificationModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

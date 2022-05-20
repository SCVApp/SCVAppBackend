import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CommonModule } from 'src/common/common.module';
import { TokenModule } from 'src/token/token.module';
import { UserModule } from 'src/user/user.module';
import { TicketModule } from 'src/ticket/ticket.module';

@Module({
  imports: [TokenModule, CommonModule, UserModule, TokenModule, TicketModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

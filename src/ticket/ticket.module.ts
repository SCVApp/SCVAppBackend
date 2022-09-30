import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';
import { AdminUser } from './entities/adminUser.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, AdminUser]),
    MailModule,
    UserModule,
  ],
  providers: [TicketService],
  exports: [TicketService],
  controllers: [TicketController],
})
export class TicketModule {}

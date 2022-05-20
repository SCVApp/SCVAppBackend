import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/adminUser.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketService } from './ticket.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, AdminUser])],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}

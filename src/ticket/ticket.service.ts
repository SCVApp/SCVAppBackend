import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserDto } from './dto/adminUser.dto';
import { AdminUser } from './entities/adminUser.entity';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketReposetory: Repository<Ticket>,
    @InjectRepository(AdminUser)
    private readonly adminUserReposetory: Repository<AdminUser>,
  ) {}

  async getUser(user: AdminUserDto): Promise<AdminUser> {
    return this.adminUserReposetory.save(user);
  }
  async getAll(user: AdminUserDto): Promise<Ticket[] | undefined> {
    return (await this.getUser(user)).promission_tickets;
  }
}

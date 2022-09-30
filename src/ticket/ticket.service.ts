import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailDto } from 'src/mail/mail.dto';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { AdminUserDto } from './dto/adminUser.dto';
import { TicketDto } from './dto/ticket.dto';
import { AdminUser } from './entities/adminUser.entity';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketReposetory: Repository<Ticket>,
    @InjectRepository(AdminUser)
    private readonly adminUserReposetory: Repository<AdminUser>,
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  async getUser(user: AdminUserDto): Promise<AdminUser> {
    let adUser = await this.adminUserReposetory.findOne({ where: user });
    if (adUser) {
      return adUser;
    }
    return await this.adminUserReposetory.save(user);
  }
  async getAll(user: AdminUserDto): Promise<Ticket[] | undefined> {
    return (await this.getUser(user)).promission_tickets;
  }

  async createTicket(
    ticket: TicketDto,
    promissonUsers: AdminUser[],
  ): Promise<Ticket> {
    return await this.ticketReposetory.save({
      ...ticket,
      promissions_users: promissonUsers.map((e) => {
        return { id: e.id };
      }),
    });
  }

  async loadMailsInToDB() {
    let mails: MailDto[] = await this.getMail();
    for (let mail of mails) {
      let newTicket: TicketDto = {
        ...mail,
        type: 'odprto',
      };
      let permUsers = await this.adminUserReposetory.find({
        where: { isBoss: true },
      });

      await this.ticketReposetory.save({
        ...newTicket,
        promissions_users: permUsers.map((e) => {
          return { id: e.id };
        }),
      });
    }
  }

  async forwardTicket(
    id: number,
    userDto: AdminUserDto,
    userToForwardId: number,
  ) {
    try {
      let [ticket, user, userToForward] = await Promise.all([
        this.ticketReposetory.findOne({ where: { id } }),
        this.getUser(userDto),
        this.adminUserReposetory.findOne({ where: { id: userToForwardId } }),
      ]);
      if (ticket && user && userToForward) {
        let permUsers = (await this.adminUserReposetory.find()).filter((u) => {
          return (
            u.promission_tickets.find((e) => e.id === ticket.id) !== undefined
          );
        });
        let isItHasPerm =
          permUsers.find((e) => e.user_azure_id === user.user_azure_id) !==
          undefined;
        if (!isItHasPerm) {
          throw new UnauthorizedException('Nimaš pravice da urejaš ta ticket');
        }
        await this.ticketReposetory.save({
          ...ticket,
          promissions_users: [...permUsers, userToForward],
        });
      }
    } catch (e) {
      console.log(e);
      throw new NotFoundException('Ticket ali admin ne obstajata');
    }
  }

  async getTicket(
    id: number,
    userDto: AdminUserDto,
  ): Promise<Ticket | undefined> {
    let [ticket, user] = await Promise.all([
      this.ticketReposetory.findOne({ where: { id } }),
      this.getUser(userDto),
    ]);
    if (ticket && user) {
      if (user.promission_tickets.find((e) => e.id === ticket.id)) {
        return ticket;
      }
      throw new UnauthorizedException(
        'Nimate pravic dostopati do tega ticketa',
      );
    }
    return undefined;
  }

  async getAdminUserDto(accessToken: string): Promise<AdminUserDto> {
    let getMe = await this.userService.getMe(accessToken);
    return {
      user_azure_id: getMe.id,
      displayName: getMe.displayName,
      email: getMe.mail,
    };
  }

  async getMail(): Promise<MailDto[]> {
    return await this.mailService.readMail();
  }

  async changeType(id: number, newType: string, userDto: AdminUserDto) {
    let [ticket, user] = await Promise.all([
      this.ticketReposetory.findOne({ where: { id } }),
      this.getUser(userDto),
    ]);
    if (ticket && user) {
      if (user.promission_tickets.find((e) => e.id === ticket.id)) {
        ticket.type = newType;
        return await this.ticketReposetory.save(ticket);
      }
      throw new UnauthorizedException(
        'Nimate pravic dostopati do tega ticketa',
      );
    }
  }

  async getAdminUsersForForward(id: number): Promise<AdminUser[]> {
    try {
      let [tikcet, users] = await Promise.all([
        this.ticketReposetory.findOne({ where: { id } }),
        this.adminUserReposetory.find(),
      ]);
      return users.filter((user) => {
        if (
          user.promission_tickets.find((e) => e.id === tikcet.id) === undefined
        ) {
          return true;
        }
        return false;
      });
    } catch (e) {
      throw new NotFoundException('Ticket ne obstaja');
    }
  }
}

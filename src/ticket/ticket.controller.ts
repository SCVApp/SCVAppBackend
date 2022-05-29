import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import SendmailTransport from 'nodemailer/lib/sendmail-transport';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { AdminUserDto } from './dto/adminUser.dto';
import { ChangeTypeDto } from './dto/changeType.dto';
import { TicketService } from './ticket.service';

@Controller('admin/ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly mailService: MailService,
  ) {}
  @Get('/all')
  async getAllTickets(@Body() body) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    let user = await this.ticketService.getAdminUserDto(accessToken);
    return this.ticketService.getAll(user);
  }
  @Get('/mail')
  async getMail() {
    await this.ticketService.loadMailsInToDB();
    return 'ok';
  }

  @Get('/forward')
  async forwardTicket(@Body() body) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    let user = await this.ticketService.getAdminUserDto(accessToken);
    this.ticketService.forwardTicket(20, user);
    return 'ok';
  }

  @Post('/changeType')
  async changeType(@Body() body: ChangeTypeDto) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    let user = await this.ticketService.getAdminUserDto(accessToken);
    return await this.ticketService.changeType(
      parseInt(body.id),
      body.newType,
      user,
    );
  }

  @Get(':id')
  async getTicket(@Param('id', ParseIntPipe) id: number, @Body() body) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    let user = await this.ticketService.getAdminUserDto(accessToken);
    return this.ticketService.getTicket(id, user);
  }
}

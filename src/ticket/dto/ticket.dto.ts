import { AdminUser } from '../entities/adminUser.entity';

export class TicketDto {
  type: string;
  naslov: string;
  zadeva: string;
  sender: string;
  datum: Date;
}

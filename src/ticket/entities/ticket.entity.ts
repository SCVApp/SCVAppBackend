import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AdminUser } from './adminUser.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  zaporedno_st: number;

  @Column()
  type: string;

  @Column()
  naslov: string;

  @Column()
  zadeva: string;

  @Column()
  sender: string;

  @ManyToMany(() => AdminUser, (adminUser) => adminUser.promission_tickets)
  promissions_users: AdminUser[];
}

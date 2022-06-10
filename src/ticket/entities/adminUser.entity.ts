import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Exclude()
  user_azure_id: string;

  @Column()
  email: string;

  @Column()
  displayName: string;

  @Column({ default: false })
  isBoss: boolean;

  @ManyToMany(() => Ticket, (ticket) => ticket.promissions_users, {
    eager: true,
  })
  @JoinColumn({ name: 'promission_tickets' })
  promission_tickets: Ticket[];
}

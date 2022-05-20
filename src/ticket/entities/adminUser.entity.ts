import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_azure_id: string;

  @Column()
  email: string;

  @Column()
  displayName: string;

  @ManyToMany(() => Ticket, (ticket) => ticket.promissions_users, {
    eager: true,
  })
  promission_tickets: Ticket[];
}

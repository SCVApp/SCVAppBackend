import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminUser } from './adminUser.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  naslov: string;

  @Column()
  zadeva: string;

  @Column()
  sender: string;

  @Column({ default: new Date() })
  datum: Date;

  @ManyToMany(() => AdminUser, (adminUser) => adminUser.promission_tickets)
  @JoinTable({
    name: 'promission_tickets',
    joinColumn: {
      name: 'ticket',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user',
      referencedColumnName: 'id',
    },
  })
  promissions_users: AdminUser[];
}

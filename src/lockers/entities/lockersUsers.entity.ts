import { UserPassEntity } from 'src/pass/entities/passUser.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LockerEntity } from './locker.entity';
@Entity('lockers_users')
export class LockersUsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => LockerEntity, { eager: true })
  @JoinColumn({ name: 'locker_id' })
  locker: LockerEntity;

  @ManyToOne((type) => UserPassEntity, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: UserPassEntity;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;
}

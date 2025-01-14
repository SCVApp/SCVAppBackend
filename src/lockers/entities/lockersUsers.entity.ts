import { UserPassEntity } from 'src/pass/entities/passUser.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { LockerEntity } from './locker.entity';
@Entity('lockers_users')
export class LockersUsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => LockerEntity, { eager: true })
  locker: LockerEntity;

  @ManyToOne((type) => UserPassEntity, { eager: true })
  user: UserPassEntity;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;
}

//Create new enitity

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PassActivityLogStatus } from '../enums/passActivityLogStatus.enum';

import { DoorPassEntity } from './doorPass.entity';
import { UserPassEntity } from './passUser.entity';

@Entity('pass_activity_logs')
export class PassActivityLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PassActivityLogStatus,
    default: PassActivityLogStatus.unknown,
  })
  status: PassActivityLogStatus;

  @ManyToOne((type) => DoorPassEntity, (doorPass) => doorPass.activity_logs, {
    eager: true,
  })
  @JoinColumn({ name: 'door_pass_id' })
  door_pass: DoorPassEntity;

  @ManyToOne((type) => UserPassEntity, (userPass) => userPass.activity_logs, {
    eager: true,
  })
  @JoinColumn({ name: 'user_pass_id' })
  user_pass: UserPassEntity;

  @CreateDateColumn()
  created_at: Date;
}

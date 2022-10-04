import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';
import { DoorPassEntity } from './doorPass.entity';
import { PassActivityLogEntity } from './passActivityLog.entity';

@Entity('user_passes')
export class UserPassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  azure_id: string;

  @Column({ nullable: true, type: 'enum', enum: UserAccessLevel })
  access_level: UserAccessLevel;

  @Column({ nullable: true })
  razred: string;

  @ManyToMany(
    (type) => DoorPassEntity,
    (doorPass) => doorPass.allways_pass_users,
    { eager: true },
  )
  @JoinTable()
  allways_door_passes: DoorPassEntity[];

  @Column({ nullable: true })
  access_level_updated_at: Date;

  @OneToMany(
    (type) => PassActivityLogEntity,
    (doorPassActivityLog) => doorPassActivityLog.user_pass,
  )
  activity_logs: PassActivityLogEntity[];
}

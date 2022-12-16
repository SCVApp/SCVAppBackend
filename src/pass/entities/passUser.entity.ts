import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';
import { PassActivityLogEntity } from './passActivityLog.entity';
import { PassTimeProfileEntity } from './passTimeProfile';

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

  @Column({ nullable: true })
  access_level_updated_at: Date;

  @OneToMany(
    (type) => PassActivityLogEntity,
    (doorPassActivityLog) => doorPassActivityLog.user_pass,
  )
  activity_logs: PassActivityLogEntity[];

  @ManyToMany(
    (type) => PassTimeProfileEntity,
    (timeProfile) => timeProfile.user_passes,
  )
  time_profiles: PassTimeProfileEntity[];
}

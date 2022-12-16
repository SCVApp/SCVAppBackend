import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';
import { PassActivityLogEntity } from './passActivityLog.entity';
import { PassControlerEntity } from './passControler.entity';
import { PassTimeProfileEntity } from './passTimeProfile';

@Entity('door_passes')
export class DoorPassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name_id: string;

  @Column({
    default: UserAccessLevel.admin,
    comment: 'What is the minimum security level that can always access.',
    type: 'enum',
    enum: UserAccessLevel,
  })
  minimum_allways_access_level: UserAccessLevel;

  @Column({ comment: 'What is the code to access this door.' })
  code: string;

  @Exclude()
  @Column({ comment: 'What is the secret to access this door.' })
  access_secret: string;

  @OneToMany(
    (type) => PassActivityLogEntity,
    (doorPassActivityLog) => doorPassActivityLog.door_pass,
  )
  activity_logs: PassActivityLogEntity[];

  @ManyToOne((type) => PassControlerEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'controler_id' })
  controler!: PassControlerEntity;

  @ManyToMany(
    (type) => PassTimeProfileEntity,
    (timeProfile) => timeProfile.door_passes,
  )
  time_profiles: PassTimeProfileEntity[];
}

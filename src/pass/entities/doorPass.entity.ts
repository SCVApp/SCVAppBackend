import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';
import { PassActivityLogEntity } from './passActivityLog.entity';
import { UserPassEntity } from './passUser.entity';

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

  @ManyToMany(
    (type) => UserPassEntity,
    (userPass) => userPass.allways_door_passes,
    { cascade: ['insert'] },
  )
  allways_pass_users: UserPassEntity[];

  @OneToMany(
    (type) => PassActivityLogEntity,
    (doorPassActivityLog) => doorPassActivityLog.door_pass,
  )
  activity_logs: PassActivityLogEntity[];
}

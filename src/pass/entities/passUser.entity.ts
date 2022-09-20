import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';
import { DoorPassEntity } from './doorPass.entity';

@Entity('user_passes')
export class UserPassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  azure_id: string;

  @Column({
    type: 'enum',
    enum: UserAccessLevel,
  })
  access_level: UserAccessLevel;

  @Column()
  rfid_card_id: string;

  @ManyToMany(
    (type) => DoorPassEntity,
    (doorPass) => doorPass.allways_pass_users,
    { eager: true },
  )
  @JoinTable()
  allways_door_passes: DoorPassEntity[];
}

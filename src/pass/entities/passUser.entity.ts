import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { DoorPassEntity } from './doorPass.entity';

@Entity('user_passes')
export class UserPassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  azure_id: string;

  @Column({ nullable: true })
  rfid_card_id: string;

  @ManyToMany(
    (type) => DoorPassEntity,
    (doorPass) => doorPass.allways_pass_users,
    { eager: true },
  )
  @JoinTable()
  allways_door_passes: DoorPassEntity[];
}

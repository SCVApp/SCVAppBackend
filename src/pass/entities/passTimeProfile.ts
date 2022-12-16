import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { DoorPassEntity } from './doorPass.entity';
import { UserPassEntity } from './passUser.entity';

@Entity('pass_time_profiles')
export class PassTimeProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column()
  start_time: Date;

  @Column()
  end_time: Date;

  @Column({ default: false })
  monday: boolean;

  @Column({ default: false })
  tuesday: boolean;

  @Column({ default: false })
  wednesday: boolean;

  @Column({ default: false })
  thursday: boolean;

  @Column({ default: false })
  friday: boolean;

  @Column({ default: false })
  saturday: boolean;

  @Column({ default: false })
  sunday: boolean;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  allways_allow: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany((type) => DoorPassEntity, (doorPass) => doorPass.time_profiles)
  @JoinTable({
    name: 'door_pass_time_profiles',
    joinColumn: {
      name: 'time_profile_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'door_pass_id',
      referencedColumnName: 'id',
    },
  })
  door_passes: DoorPassEntity[];

  @ManyToMany((type) => UserPassEntity, (userPass) => userPass.time_profiles)
  @JoinTable({
    name: 'user_pass_time_profiles',
    joinColumn: {
      name: 'time_profile_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_pass_id',
      referencedColumnName: 'id',
    },
  })
  user_passes: UserPassEntity[];
}

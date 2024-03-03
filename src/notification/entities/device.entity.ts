import { UserPassEntity } from 'src/pass/entities/passUser.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  notification_token: string;

  @Index()
  @Column()
  device_id: string;

  @ManyToOne((type) => UserPassEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: UserPassEntity;
}

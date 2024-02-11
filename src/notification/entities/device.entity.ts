import { UserPassEntity } from 'src/pass/entities/passUser.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  notification_token: string;

  @ManyToOne((type) => UserPassEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: UserPassEntity;
}

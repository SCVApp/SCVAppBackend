import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from 'typeorm';
import { LockerControllerEntity } from './lockerController.entity';
@Entity('lockers')
export class LockerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => LockerControllerEntity, { eager: true })
  @JoinColumn({ name: 'controller_id' })
  controller: LockerControllerEntity;

  @Column({ type: 'varchar', length: 5 })
  identifier: string;

  @Column({ type: 'int', default: 0 })
  position: number;
}

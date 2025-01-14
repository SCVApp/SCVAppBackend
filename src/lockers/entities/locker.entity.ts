import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { LockerControllerEntity } from './lockerController.entity';
@Entity('lockers')
export class LockerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => LockerControllerEntity, { eager: true })
  controller: LockerControllerEntity;

  @Column({ type: 'varchar', length: 5 })
  identifier: string;
}

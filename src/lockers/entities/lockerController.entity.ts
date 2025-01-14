import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LockerEntity } from './locker.entity';
@Entity('locker_controllers')
export class LockerControllerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  token: string;

  @OneToMany((type) => LockerEntity, (locker) => locker.controller)
  lockers: LockerEntity[];
}

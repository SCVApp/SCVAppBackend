//Create passControler.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DoorPassEntity } from './doorPass.entity';

@Entity('pass_controlers')
export class PassControlerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  description: string;
}

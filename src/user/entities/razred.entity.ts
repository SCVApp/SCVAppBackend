import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObdobjeUre } from './obdobjeUre.entity';

@Entity('razredi')
export class Razred {
  @PrimaryGeneratedColumn('uuid')
  public readonly id: string;

  @Column()
  name: string;

  @Column()
  id_sole: string;

  @Column()
  updated_at: Date;

  @OneToMany((type) => ObdobjeUre, (obdobjeUre) => obdobjeUre.razred, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
  })
  urnik: ObdobjeUre[];
}

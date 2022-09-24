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
  @PrimaryGeneratedColumn()
  public readonly id: number;

  @Column()
  name: string;

  @Column()
  id_sole: string;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany((type) => ObdobjeUre, (obdobjeUre) => obdobjeUre.razred, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
  })
  urnik: ObdobjeUre[];
}

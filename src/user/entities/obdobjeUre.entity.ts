import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Razred } from './razred.entity';
import { Ura } from './ura.entity';

@Entity('obdobje_ur')
export class ObdobjeUre {
  @Exclude()
  @PrimaryGeneratedColumn()
  public readonly primary_id: number;

  @Column()
  id: number;

  @Column()
  ime: string;

  @Column()
  trajanje: string;

  @ManyToOne((type) => Razred, (razred) => razred.urnik, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'razred_id' })
  razred: Razred;

  @OneToMany((type) => Ura, (ura) => ura.obdobjeUre, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
  })
  ura: Ura[];
}

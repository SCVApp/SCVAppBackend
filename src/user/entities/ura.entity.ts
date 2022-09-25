import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObdobjeUre } from './obdobjeUre.entity';

@Entity('ure')
export class Ura {
  @Exclude()
  @PrimaryGeneratedColumn('uuid')
  public readonly primary_id: string;

  @Column()
  krajsava: string;

  @Column()
  ucilnicaInUcitelj: string;

  @Column()
  ucitelj: string;

  @Column()
  ucilnica: string;

  @Column({ default: '' })
  dogodek: string;

  @Column({ default: false })
  nadomescanje: boolean;

  @Column({ default: false })
  zaposlitev: boolean;

  @Column({ default: false })
  odpadlo: boolean;

  @ManyToOne((type) => ObdobjeUre, (obdobjeUre) => obdobjeUre.ura, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'obdobje_ure_id' })
  obdobjeUre: ObdobjeUre;
}

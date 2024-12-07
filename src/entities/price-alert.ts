import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('price_alerts')
export class PriceAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coinId: string;

  @Column('decimal')
  targetPrice: number;

  @Column()
  type: 'ABOVE' | 'BELOW';

  @Column({ default: false })
  trigged: boolean;

  @ManyToOne(() => User, (user) => user.priceAlerts)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

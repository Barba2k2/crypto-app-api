import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('price_alerts')
export class PriceAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coinId: string;

  @Column('decimal', { precision: 18, scale: 8 })
  targetPrice: number;

  @Column()
  type: 'ABOVE' | 'BELOW';

  @Column({ default: false })
  triggered: boolean;

  @ManyToOne(() => User, (user) => user.priceAlerts)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

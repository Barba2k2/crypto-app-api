import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('coin_holdings')
export class CoinHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coinId: string;

  @Column('decimal')
  quantity: number;

  @Column('decimal')
  purchasePrice: number;

  @Column()
  purchaseDate: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.holdings)
  wallet: Wallet;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

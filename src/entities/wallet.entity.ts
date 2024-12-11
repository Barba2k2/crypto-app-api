import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CoinHolding } from './coin-holding.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  iconColor: string;

  @ManyToOne(() => User, (user) => user.wallets)
  user: User;

  @OneToMany(() => CoinHolding, (holding) => holding.wallet)
  holdings: CoinHolding[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  chain: string;

  @Column('jsonb', { nullable: true })
  balanceData: any;
}

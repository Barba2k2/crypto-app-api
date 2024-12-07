import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { FavoriteCoin } from './favorite-coin.entity';
import { PriceAlert } from './price-alert';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  googleId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => FavoriteCoin, (FavoriteCoin) => FavoriteCoin.user)
  favoriteCoins: FavoriteCoin[];

  @OneToMany(() => PriceAlert, (alert) => alert.user)
  priceAlerts: PriceAlert[];
}

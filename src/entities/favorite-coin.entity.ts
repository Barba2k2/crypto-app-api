import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('favorite_coins')
export class FavoriteCoin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coinId: string;

  @ManyToOne(() => User, user => user.favoriteCoins)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
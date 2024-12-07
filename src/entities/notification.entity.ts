import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  type: 'PRICE_ALERT' | 'PERFORMANCE'

  @Column()
  message: string

  @Column({ default: false })
  read: boolean

  @ManyToOne(() => User)
  user: User

  @CreateDateColumn()
  createdAt: Date;
}
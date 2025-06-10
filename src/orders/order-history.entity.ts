import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from '../users/user.entity';
import { OrderStatus } from './order-status.enum';

@Entity('order_histories')
export class OrderHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'enum', enum: OrderStatus })
  oldStatus: OrderStatus;

  @Column({ type: 'enum', enum: OrderStatus })
  newStatus: OrderStatus;

  @ManyToOne(() => User, { eager: true })
  changedBy: User;

  @CreateDateColumn()
  changedAt: Date;
}

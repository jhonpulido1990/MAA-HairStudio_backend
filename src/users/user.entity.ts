import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Wishlist } from '../wishlist/wishlist.entity';
import { Cart } from '../cart/cart.entity';
/* import { Order } from 'src/orders/order.entity';
 */
import { Address } from '../address/address.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  CUSTOM = 'custom',
}

@Entity('users') // Nombre de la tabla en la base de datos
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name?: string;

  @Index({ unique: true }) // Asegura que el email sea único
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string; // Almacenaremos la contraseña hasheada

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER, // <-- Esto es correcto
  })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  resetPasswordExpires?: Date;

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlists: Wishlist[];

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  /* @OneToMany(() => Order, (order) => order.user)
  orders: Order[]; */

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];
}

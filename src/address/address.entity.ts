import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  nombreCompleto: string;

  @Column()
  telefono: string;

  @Column({ nullable: true })
  telefonoAlternativo?: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  pais: string;

  @Column()
  departamento: string;

  @Column()
  ciudad: string;

  @Column()
  codigoPostal: string;

  @Column()
  direccionLinea1: string;

  @Column({ nullable: true })
  direccionLinea2?: string;

  @Column({ nullable: true })
  referencia?: string;

  @Column({ nullable: true })
  notasEntrega?: string;

  @Column({ default: false })
  esPrincipal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

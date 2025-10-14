import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';

@Entity('subcategories')
@Index(['name', 'categoryId'], { unique: true }) // ✅ AGREGAR: Unicidad de nombre por categoría
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index() // ✅ AGREGAR: Índice para búsquedas por nombre
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ length: 7, nullable: true })
  color?: string;

  @ManyToOne(() => Category, (category) => category.subcategories, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false, // ✅ AGREGAR: Lazy loading por defecto
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'uuid' })
  @Index() // ✅ AGREGAR: Índice para filtros por categoría
  categoryId: string;

  @OneToMany(() => Product, (product) => product.subcategory, {
    cascade: false,
    lazy: true,
  })
  products: Product[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

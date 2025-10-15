import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';

@Entity('subcategories')
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index() // ✅ AGREGAR índice para búsquedas
  name: string;

  // ✅ NUEVO: Descripción opcional
  @Column({ type: 'text', nullable: true })
  description?: string;

  // ✅ NUEVO: Orden de visualización dentro de la categoría
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  // ✅ NUEVO: Imagen opcional
  @Column({ nullable: true })
  image?: string;

  // ✅ NUEVO: Icono opcional
  @Column({ nullable: true })
  icon?: string;

  // ✅ NUEVO: Color para UI (opcional)
  @Column({ length: 7, nullable: true })
  color?: string;

  // ✅ MEJORAR: Agregar JoinColumn para mejor control
  @ManyToOne(() => Category, (category) => category.subcategories, {
    onDelete: 'CASCADE',
    nullable: false, // ✅ Asegurar que siempre tenga categoría
    eager: false,    // ✅ Lazy loading por defecto
  })
  @JoinColumn({ name: 'categoryId' }) // ✅ Nombre explícito de columna FK
  @Index() // ✅ Índice en FK para performance
  category: Category;

  // ✅ AGREGAR: ID de categoría para consultas más eficientes
  @Column({ type: 'uuid' })
  @Index() // ✅ Índice para filtros por categoría
  categoryId: string;

  @OneToMany(() => Product, (product) => product.subcategory, {
    cascade: false, // ✅ No eliminar productos automáticamente
    lazy: true,     // ✅ Cargar solo cuando sea necesario
  })
  products: Product[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // ✅ NUEVO: Índice compuesto para unicidad por categoría
  @Index(['name', 'categoryId'], { unique: true })
  static uniqueNamePerCategory: any;
}

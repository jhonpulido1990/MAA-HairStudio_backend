import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';

@Entity('subcategories')
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Category, (cat) => cat.subcategories, {
    onDelete: 'CASCADE',
  })
  category: Category;

  @OneToMany(() => Product, (product) => product.subcategory)
  products: Product[];
}

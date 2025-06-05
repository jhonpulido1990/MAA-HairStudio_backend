import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subcategory } from './subcategory.entity';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subcategory, Category, Product])],
  providers: [SubcategoriesService],
  controllers: [SubcategoriesController],
  exports: [SubcategoriesService],
})
export class SubcategoriesModule {}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subcategory } from './subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { Category } from '../categories/category.entity';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    createSubcategoryDto: CreateSubcategoryDto,
  ): Promise<Subcategory> {
    const category = await this.categoryRepository.findOneBy({
      id: createSubcategoryDto.categoryId,
    });
    if (!category) throw new NotFoundException('Categoría no encontrada.');

    const subcategory = this.subcategoryRepository.create({
      name: createSubcategoryDto.name,
      category,
    });
    return this.subcategoryRepository.save(subcategory);
  }

  async findAll(): Promise<Subcategory[]> {
    return this.subcategoryRepository.find({ relations: ['category'] });
  }

  async findOne(id: string): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!subcategory)
      throw new NotFoundException('Subcategoría no encontrada.');
    return subcategory;
  }

  async update(id: string, dto: CreateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOneBy({ id });
    if (!subcategory)
      throw new NotFoundException('Subcategoría no encontrada.');
    const category = await this.categoryRepository.findOneBy({
      id: dto.categoryId,
    });
    if (!category) throw new NotFoundException('Categoría no encontrada.');
    subcategory.name = dto.name;
    subcategory.category = category;
    return this.subcategoryRepository.save(subcategory);
  }

  async remove(id: string): Promise<{ message: string }> {
    const subcategory = await this.subcategoryRepository.findOneBy({ id });
    if (!subcategory)
      throw new NotFoundException('Subcategoría no encontrada.');
    await this.subcategoryRepository.delete(id);
    return { message: 'Subcategoría eliminada correctamente.' };
  }
}

import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Subcategory } from './subcategory.entity';
import { Category } from '../categories/category.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createSubcategoryDto: CreateSubcategoryDto): Promise<Subcategory> {
    // ✅ MEJORA: Verificar que la categoría existe
    const category = await this.categoryRepository.findOneBy({
      id: createSubcategoryDto.categoryId,
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // ✅ MEJORA: Verificar unicidad del nombre dentro de la categoría
    await this.checkNameUniqueness(
      createSubcategoryDto.name, 
      createSubcategoryDto.categoryId
    );

    const subcategory = this.subcategoryRepository.create({
      ...createSubcategoryDto,
      category,
    });

    try {
      return await this.subcategoryRepository.save(subcategory);
    } catch (error) {
      if (error.code === '23505') { // Duplicate key error
        throw new ConflictException('Ya existe una subcategoría con ese nombre en esta categoría.');
      }
      throw error;
    }
  }

  // ✅ MEJORA: findAll con paginación y filtros
  async findAll(
    page: number = 1,
    limit: number = 10,
    categoryId?: string,
    search?: string,
    includeProducts: boolean = false
  ): Promise<{
    data: Subcategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.subcategoryRepository.createQueryBuilder('subcategory')
      .leftJoinAndSelect('subcategory.category', 'category');

    // ✅ Incluir productos si se solicita
    if (includeProducts) {
      queryBuilder.leftJoinAndSelect('subcategory.products', 'products');
    }

    // ✅ Filtro por categoría
    if (categoryId) {
      queryBuilder.andWhere('subcategory.categoryId = :categoryId', { categoryId });
    }

    // ✅ Filtro de búsqueda
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(subcategory.name) LIKE LOWER(:search) OR LOWER(subcategory.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // ✅ Ordenamiento
    queryBuilder.orderBy('category.displayOrder', 'ASC')
                .addOrderBy('subcategory.displayOrder', 'ASC')
                .addOrderBy('subcategory.name', 'ASC');

    // ✅ Paginación
    const [subcategories, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: subcategories,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ✅ NUEVO: Obtener subcategorías por categoría sin paginación
  async findByCategory(categoryId: string): Promise<Subcategory[]> {
    const category = await this.categoryRepository.findOneBy({ id: categoryId });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    return this.subcategoryRepository.find({
      where: { categoryId },
      order: { displayOrder: 'ASC', name: 'ASC' },
      select: ['id', 'name', 'description', 'displayOrder', 'color', 'icon'],
    });
  }

  // ✅ NUEVO: Obtener todas las subcategorías para select (sin paginación)
  async findAllForSelect(): Promise<Array<{
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
  }>> {
    const subcategories = await this.subcategoryRepository.find({
      relations: ['category'],
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: { id: true, name: true }
      },
      order: { 
        category: { displayOrder: 'ASC', name: 'ASC' },
        displayOrder: 'ASC',
        name: 'ASC'
      }
    });

    return subcategories.map(sub => ({
      id: sub.id,
      name: sub.name,
      categoryId: sub.categoryId,
      categoryName: sub.category.name,
    }));
  }

  async findOne(id: string): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    
    if (!subcategory) {
      throw new NotFoundException('Subcategoría no encontrada.');
    }
    
    return subcategory;
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    
    if (!subcategory) {
      throw new NotFoundException('Subcategoría no encontrada.');
    }

    // ✅ MEJORA: Si se cambia la categoría, verificar que existe
    if (updateSubcategoryDto.categoryId && updateSubcategoryDto.categoryId !== subcategory.categoryId) {
      const newCategory = await this.categoryRepository.findOneBy({
        id: updateSubcategoryDto.categoryId,
      });
      if (!newCategory) {
        throw new NotFoundException('La nueva categoría no encontrada.');
      }
      subcategory.category = newCategory;
    }

    // ✅ MEJORA: Verificar unicidad del nombre si se actualiza
    if (updateSubcategoryDto.name && updateSubcategoryDto.name !== subcategory.name) {
      const categoryIdToCheck = updateSubcategoryDto.categoryId || subcategory.categoryId;
      await this.checkNameUniqueness(updateSubcategoryDto.name, categoryIdToCheck, id);
    }

    Object.assign(subcategory, updateSubcategoryDto);

    try {
      return await this.subcategoryRepository.save(subcategory);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Ya existe una subcategoría con ese nombre en esta categoría.');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['products']
    });
    
    if (!subcategory) {
      throw new NotFoundException('Subcategoría no encontrada.');
    }

    // ✅ MEJORA: Verificar si tiene productos antes de eliminar
    if (subcategory.products && subcategory.products.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la subcategoría porque tiene ${subcategory.products.length} producto(s) asociado(s).`
      );
    }

    await this.subcategoryRepository.delete(id);
    return { message: 'Subcategoría eliminada correctamente.' };
  }

  // ✅ NUEVO: Reordenar subcategorías dentro de una categoría
  async reorderSubcategories(
    categoryId: string,
    subcategoryOrders: Array<{ id: string; displayOrder: number }>
  ): Promise<{ message: string }> {
    // Verificar que la categoría existe
    const category = await this.categoryRepository.findOneBy({ id: categoryId });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // Verificar que todas las subcategorías pertenecen a la categoría
    const subcategoryIds = subcategoryOrders.map(item => item.id);
    if (subcategoryIds.length === 0) {
      throw new BadRequestException('No se proporcionaron subcategorías para reordenar.');
    }

    const subcategories = await this.subcategoryRepository.find({
      where: { categoryId },
      select: ['id', 'categoryId']
    });

    const validIds = subcategories.map(sub => sub.id);
    const invalidIds = subcategoryIds.filter(id => !validIds.includes(id));
    
    if (invalidIds.length > 0) {
      throw new BadRequestException('Algunas subcategorías no pertenecen a la categoría especificada.');
    }

    // Actualizar orden
    const promises = subcategoryOrders.map(async ({ id, displayOrder }) => {
      await this.subcategoryRepository.update(id, { displayOrder });
    });

    await Promise.all(promises);
    return { message: 'Orden de subcategorías actualizado correctamente.' };
  }

  // ✅ NUEVO: Obtener estadísticas de subcategorías
  async getSubcategoriesStats(): Promise<{
    totalSubcategories: number;
    subcategoriesWithProducts: number;
    averageProductsPerSubcategory: number;
    categoriesWithSubcategories: number;
  }> {
    const totalSubcategories = await this.subcategoryRepository.count();
    
    const subcategoriesWithProductsCount = await this.subcategoryRepository
      .createQueryBuilder('subcategory')
      .innerJoin('subcategory.products', 'product')
      .getCount();

    const avgResult = await this.subcategoryRepository
      .createQueryBuilder('subcategory')
      .leftJoin('subcategory.products', 'product')
      .select('AVG(productcount.count)', 'average')
      .from(subquery => {
        return subquery
          .select('subcategory.id', 'id')
          .addSelect('COUNT(product.id)', 'count')
          .from(Subcategory, 'subcategory')
          .leftJoin('subcategory.products', 'product')
          .groupBy('subcategory.id');
      }, 'productcount')
      .getRawOne();

    const categoriesWithSubcategoriesCount = await this.subcategoryRepository
      .createQueryBuilder('subcategory')
      .select('COUNT(DISTINCT subcategory.categoryId)', 'count')
      .getRawOne();

    return {
      totalSubcategories,
      subcategoriesWithProducts: subcategoriesWithProductsCount,
      averageProductsPerSubcategory: parseFloat(avgResult?.average || '0'),
      categoriesWithSubcategories: parseInt(categoriesWithSubcategoriesCount?.count || '0'),
    };
  }

  // ✅ MÉTODO PRIVADO: Verificar unicidad del nombre
  private async checkNameUniqueness(
    name: string, 
    categoryId: string, 
    excludeId?: string
  ): Promise<void> {
    const existingSubcategory = await this.subcategoryRepository.findOne({
      where: { 
        name: ILike(name),
        categoryId 
      }
    });
    
    if (existingSubcategory && existingSubcategory.id !== excludeId) {
      throw new ConflictException('Ya existe una subcategoría con ese nombre en esta categoría.');
    }
  }
}

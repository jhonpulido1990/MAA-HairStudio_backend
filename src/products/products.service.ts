import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Subcategory } from '../subcategories/subcategory.entity'; // Importa la entidad
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from '../categories/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>, // <--- Agrega esto
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const subcategory = await this.subcategoryRepository.findOneBy({
      id: createProductDto.subcategoryId,
    });
    if (!subcategory)
      throw new NotFoundException('Subcategoría no encontrada.');

    const product = this.productRepository.create({
      ...createProductDto,
      subcategory,
    });
    return this.productRepository.save(product);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    if (!products || products.length === 0) {
      throw new NotFoundException('No hay productos registrados.');
    }
    const totalPages = Math.ceil(total / limit);
    return { data: products, total, page, limit, totalPages };
  }

  async findOneById(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    return product;
  }

  async update(
    id: string,
    updateProductDto: Partial<CreateProductDto>,
  ): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado.');

    // Si se envía subcategoryId, valida y asigna la nueva subcategoría
    if (updateProductDto.subcategoryId) {
      const subcategory = await this.subcategoryRepository.findOneBy({
        id: updateProductDto.subcategoryId,
      });
      if (!subcategory)
        throw new NotFoundException('Subcategoría no encontrada.');
      product.subcategory = subcategory;
    }

    // Actualiza los demás campos
    Object.assign(product, updateProductDto);
    // Evita sobrescribir subcategoryId como propiedad directa
    if ('subcategoryId' in product) {
      delete (product as { subcategoryId?: string }).subcategoryId;
    }

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    await this.productRepository.delete(id);
    return { message: 'Producto eliminado correctamente.' };
  }

  async findByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validar si la categoría existe
    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
    });
    if (!category) throw new NotFoundException('Categoría no encontrada.');

    const [products, total] = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('subcategory.category', 'category')
      .where('category.id = :categoryId', { categoryId })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { data: products, total, page, limit, totalPages };
  }

  async findBySubcategory(
    subcategoryId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validar si la subcategoría existe
    const subcategory = await this.subcategoryRepository.findOneBy({
      id: subcategoryId,
    });
    if (!subcategory)
      throw new NotFoundException('Subcategoría no encontrada.');

    const [products, total] = await this.productRepository.findAndCount({
      where: { subcategory: { id: subcategoryId } },
      relations: ['subcategory', 'subcategory.category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return { data: products, total, page, limit, totalPages };
  }

  async findByFilters(
    name?: string,
    minPrice?: number,
    maxPrice?: number,
    brand?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = this.productRepository.createQueryBuilder('product');

    if (name) {
      query.andWhere('LOWER(product.name) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }
    if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }
    if (brand) {
      query.andWhere('LOWER(product.brand) LIKE :brand', {
        brand: `%${brand.toLowerCase()}%`,
      });
    }

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC');

    const [products, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data: products, total, page, limit, totalPages };
  }
}

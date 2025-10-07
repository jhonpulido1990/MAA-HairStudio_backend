import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      where: { isActive: true },
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
    const product = await this.productRepository.findOneBy({
      id,
      isActive: true,
    });
    if (product?.isActive === false) {
      throw new BadRequestException('El producto no está disponible.');
    }
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
      .andWhere('product.isActive = :isActive', { isActive: true })
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
      where: { subcategory: { id: subcategoryId }, isActive: true },
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
    type_hair?: string,          // ✅ Nuevo filtro
    desired_result?: string, 
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
      query.andWhere('LOWER(product.name) LIKE UNACCENT(LOWER(:name))', {
        name: `%${name}%`,
      });
    }
    if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }
    if (brand) {
      query.andWhere('LOWER(product.brand) LIKE UNACCENT(LOWER(:brand))', {
        brand: `%${brand}%`,
      });
    }
    // ✅ Nuevos filtros específicos de peluquería
    if (type_hair) {
      query.andWhere('UNACCENT(LOWER(product.type_hair)) LIKE UNACCENT(LOWER(:type_hair))', {
        type_hair: `%${type_hair}%`,
      });
    }

    if (desired_result) {
      query.andWhere('UNACCENT(LOWER(product.desired_result)) LIKE UNACCENT(LOWER(:desired_result))', {
        desired_result: `%${desired_result}%`,
      });
    }

    query
      .andWhere('product.isActive = :isActive', { isActive: true })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC');

    const [products, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data: products, total, page, limit, totalPages };
  }
}

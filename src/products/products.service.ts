import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
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
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    await this.productRepository.delete(id);
    return { message: 'Producto eliminado correctamente.' };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToWishlist(user: User, productId: string): Promise<Wishlist> {
    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    if (product.isActive === false) {
      throw new BadRequestException('El producto no está disponible.');
    }

    const exists = await this.wishlistRepository.findOne({
      where: { user: { id: user.id }, product: { id: productId } },
    });
    if (exists) {
      throw new BadRequestException('El producto ya está en tu wishlist.');
    }

    const wishlist = this.wishlistRepository.create({ user, product });
    return this.wishlistRepository.save(wishlist);
  }

  async removeFromWishlist(
    user: User,
    productId: string,
  ): Promise<{ message: string }> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { user: { id: user.id }, product: { id: productId } },
    });
    if (!wishlist) throw new NotFoundException('No existe en la wishlist.');
    await this.wishlistRepository.delete(wishlist.id);
    return { message: 'Producto eliminado de la wishlist.' };
  }

  async getWishlist(user: User, page = 1, limit = 10) {
    const [items, total] = await this.wishlistRepository.findAndCount({
      where: { user: { id: user.id } },
      relations: ['product'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: items
        .filter((item) => item.product.isActive !== false)
        .map((item) => ({
          id: item.product.id,
          name: item.product.name,
          image: item.product.image,
          price: item.product.price,
          description: item.product.description,
          brand: item.product.brand,
          subcategory: item.product.subcategory,
          dimension: item.product.dimension,
          weight: item.product.weight,
          stock: item.product.stock,
        })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getWishlist(user: User) {
    return this.wishlistRepository.find({
      where: { user: { id: user.id } },
      relations: ['product'],
    });
  }
}

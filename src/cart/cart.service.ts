import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { PaginatedCartResponse } from './interfaces/PaginatedCartResponse';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getCart(
    user: User,
    page = 1,
    limit = 10,
  ): Promise<PaginatedCartResponse> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      cart = this.cartRepository.create({ user, items: [] });
      await this.cartRepository.save(cart);
    }

    // Filtrar items con producto válido
    const validItems = cart.items.filter(
      (item) => !!item.product && (item.product.isActive ?? true),
    );
    const total = validItems.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = validItems.slice(start, end);

    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const totals = getCartTotals(validItems);

    return {
      data: paginatedItems.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.image,
          price: item.product.price,
          subcategory: item.product.subcategory?.name || 'N/A',
          brand: item.product.brand?.toString() || 'N/A',
          weight: item.product.weight?.toString() || '0',
          length: item.product.length?.toString() || '0',
          width: item.product.width?.toString() || '0',
          height: item.product.height?.toString() || '0',
          isActive: item.product.isActive,
        },
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      total,
      page,
      limit,
      totalPages,
      totalAmount,
      // Agrega los totales de peso y dimensiones
      totalWeight: totals.totalWeight,
      totalLength: totals.totalLength,
      totalWidth: totals.totalWidth,
      totalHeight: totals.totalHeight,
    };
  }

  async addToCart(
    user: User,
    dto: AddToCartDto,
    page = 1,
    limit = 10,
  ): Promise<PaginatedCartResponse> {
    if (dto.quantity < 1) {
      throw new BadRequestException('La cantidad debe ser al menos 1.');
    }
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      cart = this.cartRepository.create({ user, items: [] });
      await this.cartRepository.save(cart);
    }
    const product = await this.productRepository.findOneBy({
      id: dto.productId,
    });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    if (product.isActive === false)
      throw new BadRequestException('El producto no está disponible.');

    const MAX_PER_PRODUCT = 10;
    let item = cart.items.find((i) => i.product.id === dto.productId);

    const currentQuantity = item ? item.quantity : 0;
    if (product.stock < dto.quantity + currentQuantity) {
      throw new BadRequestException('No hay suficiente stock disponible.');
    }

    if (item) {
      if (item.quantity + dto.quantity > MAX_PER_PRODUCT) {
        throw new BadRequestException(
          `No puedes agregar más de ${MAX_PER_PRODUCT} unidades de este producto.`,
        );
      }
      item.quantity += dto.quantity;
      await this.cartItemRepository.save(item);
    } else {
      if (dto.quantity > MAX_PER_PRODUCT) {
        throw new BadRequestException(
          `No puedes agregar más de ${MAX_PER_PRODUCT} unidades de este producto.`,
        );
      }
      item = this.cartItemRepository.create({
        cart,
        product,
        quantity: dto.quantity,
      });
      await this.cartItemRepository.save(item);
      cart = await this.cartRepository.findOne({
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });
    }
    return this.getCart(user, page, limit);
  }

  async removeFromCart(
    user: User,
    productId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedCartResponse> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
    });
    if (!cart) throw new NotFoundException('Carrito no encontrado.');
    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) throw new NotFoundException('Producto no está en el carrito.');
    await this.cartItemRepository.delete(item.id);
    // Recarga el carrito para reflejar el cambio
    cart = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product'],
    });
    return this.getCart(user, page, limit);
  }

  async clearCart(user: User): Promise<{ message: string }> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items'],
    });
    if (!cart) throw new NotFoundException('Carrito no encontrado.');
    await this.cartItemRepository.delete({ cart: { id: cart.id } });
    return { message: 'Carrito vaciado.' };
  }

  async updateCartItem(
    user: User,
    dto: UpdateCartItemDto,
    page = 1,
    limit = 10,
  ): Promise<PaginatedCartResponse> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
    });
    if (!cart) throw new NotFoundException('Carrito no encontrado.');
    const item = cart.items.find((i) => i.product.id === dto.productId);
    if (!item) throw new NotFoundException('Producto no está en el carrito.');
    if (item.product.isActive === false) {
      throw new BadRequestException('El producto no está disponible.');
    }

    if (dto.quantity === 0) {
      await this.cartItemRepository.delete(item.id);
    } else {
      if (item.product.stock < dto.quantity) {
        throw new BadRequestException('No hay suficiente stock disponible.');
      }
      item.quantity = dto.quantity;
      await this.cartItemRepository.save(item);
    }
    return this.getCart(user, page, limit);
  }
}

function getCartTotals(items: CartItem[]) {
  return items.reduce(
    (totals, item) => {
      const { weight, length, width, height } = item.product;
      totals.totalWeight += weight ? Number(weight) * item.quantity : 0;
      totals.totalLength += length ? Number(length) * item.quantity : 0;
      totals.totalWidth += width ? Number(width) * item.quantity : 0;
      totals.totalHeight += height ? Number(height) * item.quantity : 0;
      return totals;
    },
    {
      totalWeight: 0,
      totalLength: 0,
      totalWidth: 0,
      totalHeight: 0,
    },
  );
}

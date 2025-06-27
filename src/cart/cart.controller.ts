import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Patch,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { PaginatedCartResponse } from './interfaces/PaginatedCartResponse';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

interface AuthRequest extends Request {
  user: User;
}

/**
 * Controlador para gestionar las operaciones del carrito de compras.
 *
 * - `@Get() getCart`: Obtiene el carrito del usuario autenticado, soportando paginación mediante los parámetros `page` y `limit`.
 * - `@Post() addToCart`: Agrega un producto al carrito del usuario autenticado, recibiendo los datos del producto a través del cuerpo de la petición.
 * - `@Delete(':productId') removeFromCart`: Elimina un producto específico del carrito del usuario autenticado, identificando el producto por su UUID v4.
 * - `@Delete() clearCart`: Elimina todos los productos del carrito del usuario autenticado.
 * - `@Patch() updateCartItem`: Actualiza la cantidad o información de un producto en el carrito del usuario autenticado, soportando paginación en la respuesta.
 *
 * Todas las rutas requieren autenticación JWT.
 */
@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(
    @Req() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedCartResponse> {
    return this.cartService.getCart(req.user, Number(page), Number(limit));
  }

  @Post()
  async addToCart(@Req() req: AuthRequest, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user, dto);
  }

  @Delete(':productId')
  async removeFromCart(
    @Req() req: AuthRequest,
    @Param(
      'productId',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException(
            'El productId debe tener formato UUID v4 válido.',
          ),
      }),
    )
    productId: string,
  ) {
    return this.cartService.removeFromCart(req.user, productId);
  }

  @Delete()
  async clearCart(@Req() req: AuthRequest) {
    return this.cartService.clearCart(req.user);
  }

  @Patch()
  async updateCartItem(
    @Req() req: AuthRequest,
    @Body() dto: UpdateCartItemDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.cartService.updateCartItem(
      req.user,
      dto,
      Number(page),
      Number(limit),
    );
  }
}

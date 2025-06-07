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
    @Param('productId') productId: string,
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

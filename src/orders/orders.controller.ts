import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/create-order.dto';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { Roles } from 'src/auth/roles/roles.decorator';

interface AuthRequest extends Request {
  user: User;
}

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrderFromCart(
    @Req() req: AuthRequest,
    @Body('addressId') addressId: string,
  ) {
    return this.ordersService.createOrderFromCart(req.user, addressId);
  }

  @Get()
  async findAll(
    @Req() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.ordersService.findAll(req.user, Number(page), Number(limit));
  }

  @Get(':orderId')
  async findOne(@Req() req: AuthRequest, @Param('orderId') orderId: string) {
    return this.ordersService.findOne(req.user, orderId);
  }

  @Patch(':orderId/status')
  @Roles('admin')
  async updateStatusAsAdmin(
    @Req() req: AuthRequest,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatusAsAdmin(
      orderId,
      dto.status,
      req.user,
    );
  }

  @Patch(':orderId/cancel')
  async cancelOrder(
    @Req() req: AuthRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.cancelOrder(req.user, orderId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderFromCartDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';

interface AuthRequest extends Request {
  user: User;
}

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('from-cart')
  async createFromCart(
    @Request() req: AuthRequest,
    @Body() createOrderDto: CreateOrderFromCartDto
  ) {
    return this.ordersService.createOrderFromCart(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  async findMyOrders(
    @Request() req: AuthRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10'
  ) {
    return this.ordersService.findUserOrders(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
  }

  // ✅ RUTAS ESPECÍFICAS PRIMERO - ANTES DE las dinámicas
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'custom')
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.ordersService.findAll(
      parseInt(page),
      parseInt(limit),
      status as any,
      paymentStatus as any,
      userId,
      startDate,
      endDate
    );
  }

  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('admin', 'custom')
  async getStatistics() {
    return this.ordersService.getOrderStatistics();
  }

  @Get('search/:orderNumber')
  @UseGuards(RolesGuard)
  @Roles('admin', 'custom')
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  // ✅ RUTAS DINÁMICAS AL FINAL - DESPUÉS de las específicas
  @Get(':id')
  async findOne(
    @Param('id') id: string, 
    @Request() req: AuthRequest
  ) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'custom')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}

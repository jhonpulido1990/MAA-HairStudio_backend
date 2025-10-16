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
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { 
  CreateOrderFromCartDto, 
  UpdateOrderStatusDto, 
  SetShippingCostDto,
  ConfirmOrderDto 
} from './dto/create-order.dto';
import { User } from '../users/user.entity'; // ✅ Corregir path relativo
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

interface AuthRequest extends Request {
  user: User;
}

@UseGuards(AuthGuard('jwt')) // ✅ Cambiar a JwtAuthGuard
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ✅ CREAR ORDEN DESDE CARRITO (ACTUALIZADO)
  @Post('from-cart')
  async createFromCart(
    @Request() req: AuthRequest,
    @Body() createOrderDto: CreateOrderFromCartDto
  ) {
    return this.ordersService.createOrderFromCart(req.user.id, createOrderDto);
  }

  // ✅ ESTABLECER COSTO DE ENVÍO (ADMIN)
  @Patch(':id/shipping-cost')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Usar solo 'admin' según enum
  async setShippingCost(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Request() req: AuthRequest,
    @Body() setShippingCostDto: SetShippingCostDto
  ) {
    return this.ordersService.setShippingCost(orderId, req.user.id, setShippingCostDto);
  }

  // ✅ CONFIRMAR ORDEN (CLIENTE)
  @Patch(':id/confirm')
  async confirmOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Request() req: AuthRequest,
    @Body() confirmOrderDto: ConfirmOrderDto
  ) {
    return this.ordersService.confirmOrder(orderId, req.user.id, confirmOrderDto);
  }

  // ✅ ÓRDENES PENDIENTES DE COSTO DE ENVÍO (ADMIN)
  @Get('admin/awaiting-shipping-cost')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Usar solo 'admin'
  async getOrdersAwaitingShippingCost() {
    return this.ordersService.getOrdersAwaitingShippingCost();
  }

  // ✅ MIS ÓRDENES
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

  // ✅ TODAS LAS ÓRDENES (ADMIN)
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Usar solo 'admin'
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

  // ✅ ESTADÍSTICAS (ADMIN)
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Usar solo 'admin'
  async getStatistics() {
    return this.ordersService.getOrderStatistics();
  }

  // ✅ BUSCAR POR NÚMERO DE ORDEN
  @Get('admin/search/:orderNumber')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Usar solo 'admin'
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  // ✅ OBTENER ORDEN POR ID
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string, 
    @Request() req: AuthRequest
  ) {
    return this.ordersService.findOne(id, req.user.id);
  }

  // ✅ ACTUALIZAR STATUS (ADMIN)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Usar solo 'admin'
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}

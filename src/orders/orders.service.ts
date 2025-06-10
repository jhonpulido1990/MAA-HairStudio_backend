import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './order-status.enum';
import { OrderHistory } from './order-history.entity';
import { MailerService } from '@nestjs-modules/mailer';

export interface PaginatedOrderResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,
    private readonly mailerService: MailerService,
  ) {}

  async sendOrderConfirmationEmail(userEmail: string, orderId: string) {
    const orderUrl = `https://tu-frontend.com/orders/${orderId}`;
    await this.mailerService.sendMail({
      to: userEmail,
      subject: '¡Tu orden ha sido recibida!',
      text: `Gracias por tu compra. Puedes ver el estado de tu orden aquí: ${orderUrl}`,
      // html: `<p>Gracias por tu compra. <a href="${orderUrl}">Ver orden</a></p>`,
    });
  }

  async createOrder(user: User, dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'La orden debe tener al menos un producto.',
      );
    }

    let total = 0;
    const items: OrderItem[] = [];

    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOneBy({
        id: itemDto.productId,
        isActive: true,
      });
      if (!product)
        throw new NotFoundException('Producto no encontrado o inactivo.');
      if (product.stock < itemDto.quantity)
        throw new BadRequestException('Stock insuficiente.');

      const orderItem = this.orderItemRepository.create({
        product,
        quantity: itemDto.quantity,
        price: product.price,
      });
      items.push(orderItem);
      total += product.price * itemDto.quantity;

      // Opcional: Descontar stock
      product.stock -= itemDto.quantity;
      await this.productRepository.save(product);
    }

    const order = this.orderRepository.create({
      user,
      items,
      total,
      status: OrderStatus.PENDING,
    });
    const nuevaOrden = await this.orderRepository.save(order);

    // Enviar email de confirmación
    await this.sendOrderConfirmationEmail(user.email, nuevaOrden.id);

    return nuevaOrden;
  }

  async findAll(
    user: User,
    page = 1,
    limit = 10,
  ): Promise<PaginatedOrderResponse> {
    const skip = (page - 1) * limit;
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
      relations: ['items', 'items.product'], // Opcional: Cargar relaciones si las necesitas en la lista
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(user: User, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: user.id } },
    });
    if (!order) throw new NotFoundException('Orden no encontrada.');
    return order;
  }

  async updateStatusAsAdmin(
    orderId: string,
    status: OrderStatus,
    admin: User,
  ): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Orden no encontrada.');

    const oldStatus = order.status;
    order.status = status;
    const savedOrder = await this.orderRepository.save(order);

    // Guardar historial
    const history = this.orderHistoryRepository.create({
      order,
      oldStatus,
      newStatus: status,
      changedBy: admin,
    });
    await this.orderHistoryRepository.save(history);

    // Notificación (ver más abajo)
    // await this.notifyStatusChange(order, oldStatus, status);

    return savedOrder;
  }

  async cancelOrder(user: User, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: user.id } },
      relations: ['items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada.');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Solo puedes cancelar órdenes pendientes.');
    }
    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    // Rollback de stock
    for (const item of order.items) {
      item.product.stock += item.quantity;
      await this.productRepository.save(item.product);
    }

    // Guardar historial
    const history = this.orderHistoryRepository.create({
      order,
      oldStatus: OrderStatus.PENDING,
      newStatus: OrderStatus.CANCELLED,
      changedBy: user,
    });
    await this.orderHistoryRepository.save(history);

    // Notificación (ver más abajo)
    // await this.notifyStatusChange(order, OrderStatus.PENDING, OrderStatus.CANCELLED);

    return order;
  }
}

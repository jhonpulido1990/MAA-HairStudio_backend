import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { OrderStatus } from './order-status.enum';
import { OrderHistory } from './order-history.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { CartItem } from '../cart/cart-item.entity';
import { Cart } from '../cart/cart.entity';
import { AddressService } from '../address/address.service'; // Asegúrate de importar el servicio de direcciones

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
    private readonly dataSource: DataSource, // <--- agrega esto
    private readonly addressService: AddressService, // <-- Typed AddressService, replace with actual AddressService type if available
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

  async createOrderFromCart(user: User, addressId: string): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Obtener el carrito
      const cart = await manager.getRepository(Cart).findOne({
        where: { user: { id: user.id } },
        relations: ['items', 'items.product'],
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('El carrito está vacío.');
      }

      // 2. Obtener la dirección seleccionada
      const shippingAddress = await this.addressService.findOne(
        user,
        addressId,
      );
      const shippingAddressSnapshot = {
        nombreCompleto: shippingAddress.nombreCompleto,
        telefono: shippingAddress.telefono,
        telefonoAlternativo: shippingAddress.telefonoAlternativo,
        email: shippingAddress.email,
        pais: shippingAddress.pais,
        departamento: shippingAddress.departamento,
        ciudad: shippingAddress.ciudad,
        codigoPostal: shippingAddress.codigoPostal,
        direccionLinea1: shippingAddress.direccionLinea1,
        direccionLinea2: shippingAddress.direccionLinea2,
        referencia: shippingAddress.referencia,
        notasEntrega: shippingAddress.notasEntrega,
      };

      // 3. Procesar los productos del carrito (igual que antes)
      let total = 0;
      const orderItems: OrderItem[] = [];
      for (const cartItem of cart.items) {
        const product = await manager.getRepository(Product).findOneBy({
          id: cartItem.product.id,
          isActive: true,
        });
        if (!product)
          throw new NotFoundException('Producto no encontrado o inactivo.');
        if (product.stock < cartItem.quantity)
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}.`,
          );

        const orderItem = manager.getRepository(OrderItem).create({
          product,
          quantity: cartItem.quantity,
          price: product.price,
        });
        orderItems.push(orderItem);
        total += product.price * cartItem.quantity;

        // Descontar stock
        product.stock -= cartItem.quantity;
        await manager.getRepository(Product).save(product);
      }

      // 4. Crear la orden con el snapshot de dirección
      const order = manager.getRepository(Order).create({
        user,
        items: orderItems,
        total,
        status: OrderStatus.PENDING,
        shippingAddressSnapshot,
      });
      const nuevaOrden = await manager.getRepository(Order).save(order);

      // 5. Vaciar el carrito
      await manager.getRepository(CartItem).delete({ cart: { id: cart.id } });

      return nuevaOrden;
    });
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
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .findOneBy({ id: orderId });
      if (!order) throw new NotFoundException('Orden no encontrada.');

      const oldStatus = order.status;
      order.status = status;
      const savedOrder = await manager.getRepository(Order).save(order);

      // Guardar historial
      const history = this.orderHistoryRepository.create({
        order,
        oldStatus,
        newStatus: status,
        changedBy: admin,
      });
      await manager.getRepository(OrderHistory).save(history);

      // Notificación (fuera de la transacción si lo deseas)
      // await this.notifyStatusChange(order, oldStatus, status);

      return savedOrder;
    });
  }

  async cancelOrder(user: User, orderId: string): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({
        where: { id: orderId, user: { id: user.id } },
        relations: ['items', 'items.product'],
      });
      if (!order) throw new NotFoundException('Orden no encontrada.');
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Solo puedes cancelar órdenes pendientes.',
        );
      }
      order.status = OrderStatus.CANCELLED;
      await manager.getRepository(Order).save(order);

      // Rollback de stock
      for (const item of order.items) {
        item.product.stock += item.quantity;
        await manager.getRepository(Product).save(item.product);
      }

      // Guardar historial
      const history = this.orderHistoryRepository.create({
        order,
        oldStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.CANCELLED,
        changedBy: user,
      });
      await manager.getRepository(OrderHistory).save(history);

      // Notificación (fuera de la transacción si lo deseas)
      // await this.notifyStatusChange(order, OrderStatus.PENDING, OrderStatus.CANCELLED);

      return order;
    });
  }
}

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './orders.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { AddressService } from '../address/address.service';
import { CreateOrderFromCartDto, UpdateOrderStatusDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private addressService: AddressService,
    private dataSource: DataSource,
  ) {}

  async createOrderFromCart(
    userId: string, 
    createOrderDto: CreateOrderFromCartDto
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener carrito del usuario
      const cart = await this.cartRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('El carrito está vacío');
      }

      // 2. Validar stock de productos
      for (const item of cart.items) {
        const product = await this.productRepository.findOne({
          where: { id: item.product.id }
        });
        
        if (!product || !product.isActive) {
          throw new BadRequestException(`Producto ${item.product.name} no disponible`);
        }
        
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}`
          );
        }
      }

      // 3. Procesar dirección de envío si se proporciona
      let shippingAddress: any = null;
      let shippingSnapshot: any = null;

      if (createOrderDto.shippingAddressId) {
        // ✅ SOLUCIÓN ROBUSTA: Obtener el user completo
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }
        
        shippingAddress = await this.addressService.findOne(user, createOrderDto.shippingAddressId);
        
        // Crear snapshot de la dirección
        shippingSnapshot = {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          street: `${shippingAddress.street} ${shippingAddress.streetNumber}`,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
          phone: shippingAddress.phoneNumber,
        };
      }

      // 4. Calcular totales
      const subtotal = cart.items.reduce((sum, item) => {
        return sum + (Number(item.product.price) * item.quantity);
      }, 0);
      
      const shippingCost = shippingAddress ? 15000 : 0; // $15.000 COP si hay envío
      const tax = subtotal * 0.19; // IVA Colombia 19%
      const total = subtotal + shippingCost + tax;

      // 5. Generar número de orden único
      const orderNumber = await this.generateOrderNumber();

      // 6. Crear orden
      const order = this.orderRepository.create({
        orderNumber,
        user: { id: userId },
        subtotal,
        shippingCost,
        tax,
        total,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddress,
        shippingSnapshot,
        notes: createOrderDto.notes,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // 7. Crear items de la orden y actualizar stock
      const orderItems: OrderItem[] = [];
      for (const cartItem of cart.items) {
        const orderItem = this.orderItemRepository.create({
          order: savedOrder,
          product: cartItem.product,
          quantity: cartItem.quantity,
          unitPrice: cartItem.product.price,
          totalPrice: Number(cartItem.product.price) * cartItem.quantity,
          productName: cartItem.product.name,
          productBrand: cartItem.product.brand,
          productTypeHair: cartItem.product.type_hair,
          productDesiredResult: cartItem.product.desired_result,
          productImage: cartItem.product.image,
          productVolume: cartItem.product.volume,
        });

        orderItems.push(orderItem);

        // Actualizar stock
        await queryRunner.manager.update(
          Product,
          { id: cartItem.product.id },
          { stock: () => `stock - ${cartItem.quantity}` }
        );
      }

      await queryRunner.manager.save(orderItems);

      // 8. Limpiar carrito
      await queryRunner.manager.delete('cart_items', { cart: { id: cart.id } });

      await queryRunner.commitTransaction();

      // 9. Retornar orden completa
      const completeOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'shippingAddress', 'user']
      });

      return completeOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'shippingAddress'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return { data: orders, total, page, limit, totalPages };
  }

  async findOne(id: string, userId?: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'shippingAddress', 'user']
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Si se proporciona userId, verificar que la orden pertenece al usuario
    if (userId && order.user.id !== userId) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.product', 'shippingAddress', 'user']
    });

    if (!order) {
      throw new NotFoundException(`Orden con número ${orderNumber} no encontrada`);
    }

    return order;
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);
    
    Object.assign(order, updateDto);
    return this.orderRepository.save(order);
  }

  private async generateOrderNumber(): Promise<string> {
    const count = await this.orderRepository.count();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `MAA-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus,
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalOrders: number;
      totalRevenue: number;
      pendingOrders: number;
      completedOrders: number;
    };
  }> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress');

    // Filtros opcionales
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (userId) {
      queryBuilder.andWhere('order.user.id = :userId', { userId });
    }

    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { 
        endDate: new Date(endDate + 'T23:59:59.999Z') 
      });
    }

    // Paginación
    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Calcular resumen básico
    const totalOrders = await this.orderRepository.count();
    
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalRevenue')
      .where('order.paymentStatus = :status', { status: PaymentStatus.APPROVED })
      .getRawOne();

    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING }
    });

    const completedOrders = await this.orderRepository.count({
      where: { status: OrderStatus.DELIVERED }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
      summary: {
        totalOrders,
        totalRevenue: parseFloat(revenueResult?.totalRevenue || '0'),
        pendingOrders,
        completedOrders,
      }
    };
  }

  // Método adicional para obtener estadísticas detalladas
  async getOrderStatistics(): Promise<{
    ordersByStatus: Record<OrderStatus, number>;
    ordersByPaymentStatus: Record<PaymentStatus, number>;
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
    topProducts: Array<{ productName: string; totalSold: number; revenue: number }>;
  }> {
    // Estadísticas por estado
    const ordersByStatus = {} as Record<OrderStatus, number>;
    for (const status of Object.values(OrderStatus)) {
      ordersByStatus[status] = await this.orderRepository.count({ 
        where: { status } 
      });
    }

    // Estadísticas por estado de pago
    const ordersByPaymentStatus = {} as Record<PaymentStatus, number>;
    for (const paymentStatus of Object.values(PaymentStatus)) {
      ordersByPaymentStatus[paymentStatus] = await this.orderRepository.count({ 
        where: { paymentStatus } 
      });
    }

    // Ingresos mensuales (últimos 6 meses)
    const monthlyRevenueQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM(total) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE "paymentStatus" = 'approved' 
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;
    
    const monthlyRevenue = await this.orderRepository.query(monthlyRevenueQuery);

    // Productos más vendidos
    const topProductsQuery = `
      SELECT 
        oi."productName",
        SUM(oi.quantity) as "totalSold",
        SUM(oi."totalPrice") as revenue
      FROM order_items oi
      INNER JOIN orders o ON oi."orderId" = o.id
      WHERE o."paymentStatus" = 'approved'
      GROUP BY oi."productName"
      ORDER BY "totalSold" DESC
      LIMIT 10
    `;

    const topProducts = await this.orderRepository.query(topProductsQuery);

    return {
      ordersByStatus,
      ordersByPaymentStatus,
      monthlyRevenue: monthlyRevenue.map((row: any) => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        orders: parseInt(row.orders)
      })),
      topProducts: topProducts.map((row: any) => ({
        productName: row.productName,
        totalSold: parseInt(row.totalSold),
        revenue: parseFloat(row.revenue)
      }))
    };
  }
}

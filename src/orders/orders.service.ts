import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, DeliveryType } from './orders.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { Product } from '../products/product.entity';
import { User, UserRole } from '../users/user.entity';
import { AddressService } from '../address/address.service';
import { 
  CreateOrderFromCartDto, 
  SetShippingCostDto, 
  ConfirmOrderDto, 
  UpdateOrderStatusDto 
} from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

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

  // ✅ CREAR ORDEN DESDE CARRITO (ACTUALIZADO)
  async createOrderFromCart(
    userId: string, 
    createOrderDto: CreateOrderFromCartDto
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { deliveryType, shippingAddressId, notes } = createOrderDto;

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
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product.id }
        });
        
        if (!product || !product.isActive) {
          throw new BadRequestException(`Producto ${item.product.name} no disponible`);
        }
        
        if (product.trackInventory && product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}`
          );
        }
      }

      // 3. Procesar dirección si es delivery
      let shippingAddress: { id: string } | null = null;
      let shippingSnapshot: {
        recipientName: string;
        phone: string;
        fullAddress: string;
        province: string;
        city: string;
        postalCode: string;
        deliveryInstructions?: string;
      } | null = null;

      if (deliveryType === DeliveryType.DELIVERY) {
        if (!shippingAddressId) {
          throw new BadRequestException('Se requiere dirección de envío para delivery');
        }

        try {
          // Obtener dirección del usuario usando AddressService
          const addressResponse = await this.addressService.getAddressById(userId, shippingAddressId);
          shippingAddress = { id: shippingAddressId };
          
          // Crear snapshot de la dirección
          shippingSnapshot = {
            recipientName: addressResponse.data.recipientName,
            phone: addressResponse.data.phone,
            fullAddress: addressResponse.data.fullAddress,
            province: addressResponse.data.province,
            city: addressResponse.data.city,
            postalCode: addressResponse.data.postalCode,
            deliveryInstructions: addressResponse.data.deliveryInstructions,
          };
        } catch (error) {
          this.logger.error(`Error al obtener dirección ${shippingAddressId}:`, error);
          throw new BadRequestException('Dirección de envío no válida');
        }
      }

      // 4. Calcular totales
      const subtotal = cart.items.reduce((sum, item) => {
        const price = Number(item.product.finalPrice || item.product.price);
        return sum + (price * item.quantity);
      }, 0);

      // Para pickup: sin costo de envío
      // Para delivery: se establecerá después por admin
      const shippingCost = deliveryType === DeliveryType.PICKUP ? 0 : 0;
      const tax = subtotal * 0.21; // IVA Argentina 21%
      const total = subtotal + shippingCost + tax;

      // 5. Determinar estado inicial
      const initialStatus = deliveryType === DeliveryType.DELIVERY 
        ? OrderStatus.AWAITING_SHIPPING_COST 
        : OrderStatus.PENDING;

      // 6. Generar número de orden único
      const orderNumber = await this.generateOrderNumber();

      // 7. Crear orden
      const orderData: Partial<Order> = {
        orderNumber,
        user: { id: userId } as User,
        deliveryType,
        subtotal,
        shippingCost,
        tax,
        total,
        status: initialStatus,
        paymentStatus: PaymentStatus.PENDING,
        notes,
        isShippingCostSet: deliveryType === DeliveryType.PICKUP,
      };

      // Add shippingSnapshot only if it's not null
      if (shippingSnapshot) {
        orderData.shippingSnapshot = shippingSnapshot;
      }

      // Add shippingAddress only if it exists
      if (shippingAddress) {
        orderData.shippingAddress = { id: shippingAddress.id } as any;
      }

      const order = queryRunner.manager.create(Order, orderData);
      const savedOrder = await queryRunner.manager.save(order);

      // 8. Crear items de la orden
      const orderItems: Partial<OrderItem>[] = [];
      
      for (const cartItem of cart.items) {
        const unitPrice = Number(cartItem.product.finalPrice || cartItem.product.price);
        const totalPrice = unitPrice * cartItem.quantity;

        const orderItem = queryRunner.manager.create(OrderItem, {
          order: { id: savedOrder.id },
          product: { id: cartItem.product.id },
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice,
          productName: cartItem.product.name,
          productBrand: cartItem.product.brand || '',
          productTypeHair: cartItem.product.type_hair || '',
          productDesiredResult: cartItem.product.desired_result || '',
          productImage: cartItem.product.image || '',
          productVolume: cartItem.product.volume || '',
        });

        orderItems.push(orderItem);

        // Actualizar stock solo si se trackea inventario
        if (cartItem.product.trackInventory) {
          const currentProduct = await queryRunner.manager.findOne(Product, {
            where: { id: cartItem.product.id }
          });

          if (currentProduct && currentProduct.stock >= cartItem.quantity) {
            await queryRunner.manager.update(
              Product,
              { id: cartItem.product.id },
              { stock: currentProduct.stock - cartItem.quantity }
            );
          } else {
            throw new BadRequestException(
              `Stock insuficiente para ${cartItem.product.name}`
            );
          }
        }
      }

      await queryRunner.manager.save(OrderItem, orderItems);

      // 9. Limpiar carrito
      await queryRunner.manager.delete('cart_items', { cart: { id: cart.id } });

      this.logger.log(
        `Orden ${orderNumber} creada exitosamente. ` +
        `Tipo: ${deliveryType}, Estado: ${initialStatus}, ` +
        `Items: ${orderItems.length}, Total: $${total}`
      );

      await queryRunner.commitTransaction();

      // 10. Obtener orden completa
      const orderWithRelations = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['user', 'items', 'items.product', 'shippingAddress'],
      });

      if (!orderWithRelations) {
        throw new BadRequestException('Error al recuperar la orden creada');
      }

      // Limpiar datos sensibles
      if (orderWithRelations.user?.password_hash) {
        delete (orderWithRelations.user as any).password_hash;
      }

      // 11. Enviar notificaciones según el tipo
      try {
        if (deliveryType === DeliveryType.DELIVERY) {
          await this.notifyAdminsForShippingCost(orderWithRelations);
        } else {
          await this.notifyOrderCreated(orderWithRelations);
        }
      } catch (notificationError) {
        this.logger.error(
          `Error en notificaciones para orden ${orderNumber}:`, 
          notificationError
        );
        // No fallar la creación por error de notificación
      }

      return {
        success: true,
        message: `Orden ${orderNumber} creada exitosamente`,
        data: orderWithRelations,
        meta: {
          deliveryType,
          requiresShippingCost: orderWithRelations.requiresShippingCost,
          isReadyForPayment: orderWithRelations.isReadyForPayment,
          statusDescription: orderWithRelations.statusDescription,
        }
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al crear orden desde carrito para usuario ${userId}: ${error.message}`,
        error.stack
      );
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        'Error interno al crear la orden. Por favor intenta nuevamente.'
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ✅ ESTABLECER COSTO DE ENVÍO (ADMIN)
  async setShippingCost(
    orderId: string, 
    adminId: string, 
    setShippingCostDto: SetShippingCostDto
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { shippingCost, shippingNotes } = setShippingCostDto;

      // Verificar que la orden existe y está esperando costo de envío
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['user'],
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      if (order.status !== OrderStatus.AWAITING_SHIPPING_COST) {
        throw new BadRequestException(
          `No se puede establecer costo de envío. Estado actual: ${order.status}`
        );
      }

      if (order.deliveryType !== DeliveryType.DELIVERY) {
        throw new BadRequestException('Solo se puede establecer costo para órdenes de delivery');
      }

      // Actualizar orden con costo de envío
      const newTotal = Number(order.subtotal) + Number(shippingCost) + Number(order.tax);

      await queryRunner.manager.update(Order, orderId, {
        shippingCost: Number(shippingCost),
        total: newTotal,
        isShippingCostSet: true,
        status: OrderStatus.SHIPPING_COST_SET,
        shippingCostSetBy: adminId,
        shippingCostSetAt: new Date(),
        shippingNotes,
      });

      this.logger.log(
        `Costo de envío $${shippingCost} establecido para orden ${order.orderNumber} por admin ${adminId}`
      );

      await queryRunner.commitTransaction();

      // Obtener orden actualizada
      const updatedOrder = await this.findOne(orderId);

      // Notificar al cliente
      await this.notifyCustomerShippingCost(updatedOrder);

      return {
        success: true,
        message: 'Costo de envío establecido exitosamente',
        data: updatedOrder,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al establecer costo de envío para orden ${orderId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ✅ CONFIRMAR ORDEN (CLIENTE)
  async confirmOrder(
    orderId: string, 
    userId: string, 
    confirmOrderDto: ConfirmOrderDto
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que la orden pertenece al usuario
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId, user: { id: userId } },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      if (order.status !== OrderStatus.SHIPPING_COST_SET) {
        throw new BadRequestException(
          `No se puede confirmar orden. Estado actual: ${order.status}`
        );
      }

      // Confirmar orden
      await queryRunner.manager.update(Order, orderId, {
        status: OrderStatus.CONFIRMED,
        customerConfirmedAt: new Date(),
      });

      this.logger.log(`Orden ${order.orderNumber} confirmada por cliente ${userId}`);

      await queryRunner.commitTransaction();

      // Obtener orden actualizada
      const confirmedOrder = await this.findOne(orderId);

      // Notificar confirmación
      await this.notifyOrderConfirmed(confirmedOrder);

      return {
        success: true,
        message: 'Orden confirmada exitosamente',
        data: confirmedOrder,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al confirmar orden ${orderId} por usuario ${userId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ✅ OBTENER ÓRDENES PENDIENTES DE COSTO DE ENVÍO (ADMIN)
  async getOrdersAwaitingShippingCost() {
    try {
      const orders = await this.orderRepository.find({
        where: { 
          status: OrderStatus.AWAITING_SHIPPING_COST,
          deliveryType: DeliveryType.DELIVERY 
        },
        relations: ['user', 'items', 'items.product'],
        order: { createdAt: 'ASC' }, // Más antiguas primero
      });

      // Ocultar passwords
      orders.forEach(order => {
        if (order.user?.password_hash) {
          delete (order.user as any).password_hash;
        }
      });

      return {
        success: true,
        message: 'Órdenes pendientes de costo de envío obtenidas',
        data: orders,
        meta: {
          total: orders.length,
          pendingSince: orders.length > 0 ? orders[0].createdAt : null,
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener órdenes pendientes de costo de envío:', error);
      throw new BadRequestException('Error al obtener órdenes pendientes');
    }
  }

  // ✅ MÉTODOS DE NOTIFICACIÓN (PLACEHOLDER - implementaremos después)
  private async notifyAdminsForShippingCost(order: Order) {
    this.logger.log(`📧 Notificando admins sobre nueva orden de delivery: ${order.orderNumber}`);
    // TODO: Implementar envío de email a admins
    console.log('📧 EMAIL TO ADMINS:', {
      subject: `Nueva orden requiere cotización de envío - ${order.orderNumber}`,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
      shippingAddress: order.shippingSnapshot,
      items: order.items.length,
      subtotal: order.subtotal,
    });
  }

  private async notifyCustomerShippingCost(order: Order) {
    this.logger.log(`📧 Notificando cliente sobre costo de envío: ${order.orderNumber}`);
    // TODO: Implementar envío de email a cliente
    console.log('📧 EMAIL TO CUSTOMER:', {
      subject: `Costo de envío establecido para tu orden ${order.orderNumber}`,
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      shippingCost: order.shippingCost,
      total: order.total,
      confirmUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/confirm`,
    });
  }

  private async notifyOrderCreated(order: Order) {
    this.logger.log(`📧 Notificando creación de orden pickup: ${order.orderNumber}`);
    // TODO: Implementar notificación de orden creada
  }

  private async notifyOrderConfirmed(order: Order) {
    this.logger.log(`📧 Notificando confirmación de orden: ${order.orderNumber}`);
    // TODO: Implementar notificación de orden confirmada
  }

  private async getAdminEmails(): Promise<string[]> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: ['email'],
    });
    
    return admins.map(admin => admin.email);
  }

  // ... métodos existentes (findOne, findUserOrders, etc.)
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

    order.user && delete (order.user as any).password_hash;
    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    try {
      const count = await this.orderRepository.count();
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const orderNumber = `MAA-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
      
      // Verificar unicidad
      const existingOrder = await this.orderRepository.findOne({
        where: { orderNumber }
      });
      
      if (existingOrder) {
        const timestamp = Date.now().toString().slice(-4);
        return `MAA-${year}${month}${day}-${String(count + 1).padStart(4, '0')}-${timestamp}`;
      }
      
      return orderNumber;
    } catch (error) {
      this.logger.error('Error al generar número de orden:', error);
      const timestamp = Date.now();
      return `MAA-${timestamp}`;
    }
  }

  // ✅ AGREGAR MÉTODOS FALTANTES QUE USA EL CONTROLLER

  async findUserOrders(userId: string, page: number = 1, limit: number = 10) {
    try {
      const [orders, total] = await this.orderRepository.findAndCount({
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'shippingAddress'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Limpiar datos sensibles
      orders.forEach(order => {
        if (order.user?.password_hash) {
          delete (order.user as any).password_hash;
        }
      });

      return {
        success: true,
        message: 'Órdenes del usuario obtenidas exitosamente',
        data: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      this.logger.error(`Error al obtener órdenes del usuario ${userId}:`, error);
      throw new BadRequestException('Error al obtener las órdenes');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus,
    userId?: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('order.shippingAddress', 'shippingAddress');

      // Filtros
      if (status) {
        queryBuilder.andWhere('order.status = :status', { status });
      }

      if (paymentStatus) {
        queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
      }

      if (userId) {
        queryBuilder.andWhere('order.user.id = :userId', { userId });
      }

      if (startDate && endDate) {
        queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });
      }

      // Paginación
      queryBuilder
        .orderBy('order.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [orders, total] = await queryBuilder.getManyAndCount();

      // Limpiar datos sensibles
      orders.forEach(order => {
        if (order.user?.password_hash) {
          delete (order.user as any).password_hash;
        }
      });

      return {
        success: true,
        message: 'Órdenes obtenidas exitosamente',
        data: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          filters: { status, paymentStatus, userId, startDate, endDate }
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener todas las órdenes:', error);
      throw new BadRequestException('Error al obtener las órdenes');
    }
  }

  async getOrderStatistics() {
    try {
      const [
        totalOrders,
        pendingOrders,
        awaitingShippingCost,
        confirmedOrders,
        paidOrders,
        deliveredOrders,
        totalRevenue,
        todayOrders,
        thisMonthOrders
      ] = await Promise.all([
        this.orderRepository.count(),
        this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
        this.orderRepository.count({ where: { status: OrderStatus.AWAITING_SHIPPING_COST } }),
        this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } }),
        this.orderRepository.count({ where: { paymentStatus: PaymentStatus.APPROVED } }),
        this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
        this.orderRepository
          .createQueryBuilder('order')
          .select('SUM(order.total)', 'total')
          .where('order.paymentStatus = :status', { status: PaymentStatus.APPROVED })
          .getRawOne(),
        this.orderRepository.count({
          where: {
            createdAt: Between(
              new Date(new Date().setHours(0, 0, 0, 0)),
              new Date(new Date().setHours(23, 59, 59, 999))
            )
          }
        }),
        this.orderRepository.count({
          where: {
            createdAt: Between(
              new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            )
          }
        })
      ]);

      return {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          totalOrders,
          ordersByStatus: {
            pending: pendingOrders,
            awaitingShippingCost,
            confirmed: confirmedOrders,
            paid: paidOrders,
            delivered: deliveredOrders,
          },
          revenue: {
            total: Number(totalRevenue?.total || 0),
            currency: 'ARS'
          },
          periods: {
            today: todayOrders,
            thisMonth: thisMonthOrders,
          }
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener estadísticas:', error);
      throw new BadRequestException('Error al obtener estadísticas');
    }
  }

  async findByOrderNumber(orderNumber: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { orderNumber },
        relations: ['user', 'items', 'items.product', 'shippingAddress'],
      });

      if (!order) {
        throw new NotFoundException(`Orden con número ${orderNumber} no encontrada`);
      }

      // Limpiar datos sensibles
      if (order.user?.password_hash) {
        delete (order.user as any).password_hash;
      }

      return {
        success: true,
        message: 'Orden encontrada exitosamente',
        data: order,
      };
    } catch (error) {
      this.logger.error(`Error al buscar orden ${orderNumber}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al buscar la orden');
    }
  }

  async updateStatus(orderId: string, updateDto: UpdateOrderStatusDto) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['user'],
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      // Validaciones de transición de estado
      if (updateDto.status === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.APPROVED) {
        throw new BadRequestException('No se puede cancelar una orden ya pagada');
      }

      await this.orderRepository.update(orderId, {
        status: updateDto.status,
        ...(updateDto.paymentStatus && { paymentStatus: updateDto.paymentStatus }),
        ...(updateDto.notes && { notes: updateDto.notes }),
      });

      this.logger.log(`Estado de orden ${order.orderNumber} actualizado a ${updateDto.status}`);

      // Obtener orden actualizada
      const updatedOrder = await this.findOne(orderId);

      return {
        success: true,
        message: 'Estado de orden actualizado exitosamente',
        data: updatedOrder,
      };
    } catch (error) {
      this.logger.error(`Error al actualizar estado de orden ${orderId}:`, error);
      throw error;
    }
  }

  // ... resto de métodos existentes (createOrderFromCart, setShippingCost, etc.)
}

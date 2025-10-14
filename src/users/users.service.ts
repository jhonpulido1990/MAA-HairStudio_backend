import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { User, UserRole } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from 'src/auth/dto/update_user';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
// Remove the shippo Order import since we're using our own Order entity

export interface InternalCreateUserDto {
  email: string;
  password_hash: string;
  name?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  async create(userData: InternalCreateUserDto): Promise<User> {
    const { email } = userData;
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico.',
      );
    }

    const user = this.userRepository.create(userData);
    try {
      return await this.userRepository.save(user);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        'No se pudo crear el usuario. :' + errorMessage,
      );
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  // ✅ SIMPLIFICADO: Ya no necesita exclusión manual
  async findOneById(
    requestingUser: User,
    userId: string,
  ): Promise<User | null> {
    if (
      requestingUser.id !== userId &&
      requestingUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('No tienes permisos para ver este usuario.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      // ✅ Ya no necesitamos select específico, @Exclude() maneja la seguridad
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return user;
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return user;
  }

  // ✅ SIMPLIFICADO: Ya no necesita exclusión manual
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      // ✅ Eliminar select específico, @Exclude() maneja la seguridad
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ✅ SIMPLIFICADO: Ya no necesita exclusión manual
  async updateUserRole(
    userId: string,
    newRole: UserRole,
  ): Promise<User> {
    console.log('Nuevo rol recibido:', newRole, typeof newRole);

    if (!Object.values(UserRole).includes(newRole)) {
      throw new BadRequestException('Rol no válido.');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    user.role = newRole;
    await this.userRepository.save(user);

    // ✅ Retornar user completo, @Exclude() oculta datos sensibles automáticamente
    return user;
  }

  // ✅ SIMPLIFICADO: Ya no necesita exclusión manual
  async updateUser(
    requestingUser: User,
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (
      requestingUser.id !== userId &&
      requestingUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este usuario.',
      );
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;

    await this.userRepository.save(user);

    // ✅ Retornar user completo, @Exclude() oculta datos sensibles automáticamente
    return user;
  }

  async deleteUser(
    requestingUser: User,
    userId: string,
  ): Promise<{ message: string }> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo un administrador puede eliminar usuarios.',
      );
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    await this.userRepository.delete(userId);
    return { message: 'Usuario eliminado correctamente.' };
  }

  async deleteOwnAccount(user: User): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findOneBy({ id: user.id });
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    await this.userRepository.delete(user.id);
    return { message: 'Tu cuenta y todos tus datos han sido eliminados.' };
  }

  async sendPasswordResetEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.userRepository.save(user);

    const resetUrl = `https://tu-frontend.com/reset-password?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Recupera tu contraseña',
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetUrl}`,
      // Puedes agregar html si lo deseas:
      // html: `<a href="${resetUrl}">Restablecer contraseña</a>`
    });

    return { message: 'Correo de recuperación enviado.' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOneBy({
      resetPasswordToken: token,
    });
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  // Nuevos métodos sugeridos
  async getUserWithOrders(
    requestingUser: User,
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    user: User;
    orders: {
      data: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Verificar permisos
    if (requestingUser.id !== userId && requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permisos para ver este usuario.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Obtener órdenes paginadas
    const orderRepository = this.userRepository.manager.getRepository('Order');
    const [orders, total] = await orderRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      user,
      orders: {
        data: orders,
        total,
        page,
        limit,
        totalPages,
      }
    };
  }

  // Estadísticas de usuario
  async getUserStats(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['orders'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      totalOrders: user.orders.length,
      totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
      lastOrderDate: user.orders[0]?.createdAt || null,
    };
  }

  // ✅ NUEVO: Estadísticas detalladas del usuario
  async getUserStatistics(
    requestingUser: User,
    userId: string
  ): Promise<{
    user: Partial<User>;
    statistics: {
      totalOrders: number;
      totalSpent: number;
      averageOrderValue: number;
      lastOrderDate: Date | null;
      ordersByStatus: Record<string, number>;
      monthlyOrdersCount: Array<{ month: string; count: number; total: number }>;
      favoriteProducts: Array<{ productName: string; quantity: number; times: number }>;
    };
  }> {
    // Verificar permisos
    if (requestingUser.id !== userId && requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permisos para ver estas estadísticas.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Consultas de estadísticas
    const orderRepository = this.userRepository.manager.getRepository('Order');

    // Total de órdenes y gasto
    const orderStats = await orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(order.id) as totalOrders',
        'COALESCE(SUM(order.total), 0) as totalSpent',
        'COALESCE(AVG(order.total), 0) as averageOrderValue',
      ])
      .where('order.userId = :userId', { userId })
      .andWhere('order.paymentStatus = :status', { status: 'approved' })
      .getRawOne();

    // Última orden
    const lastOrder = await orderRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      select: ['createdAt'],
    });

    // Órdenes por estado
    const ordersByStatusQuery = await orderRepository
      .createQueryBuilder('order')
      .select(['order.status as status', 'COUNT(order.id) as count'])
      .where('order.userId = :userId', { userId })
      .groupBy('order.status')
      .getRawMany();

    const ordersByStatus: Record<string, number> = {};
    ordersByStatusQuery.forEach(item => {
      ordersByStatus[item.status] = parseInt(item.count);
    });

    // Órdenes por mes (últimos 6 meses)
    const monthlyOrders = await orderRepository
      .createQueryBuilder('order')
      .select([
        "TO_CHAR(DATE_TRUNC('month', order.createdAt), 'YYYY-MM') as month",
        'COUNT(order.id) as count',
        'SUM(order.total) as total'
      ])
      .where('order.userId = :userId', { userId })
      .andWhere('order.createdAt >= :date', { 
        date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) 
      })
      .groupBy("DATE_TRUNC('month', order.createdAt)")
      .orderBy('month', 'DESC')
      .getRawMany();

    // Productos favoritos
    const favoriteProducts = await orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .select([
        'item.productName as productName',
        'SUM(item.quantity) as quantity',
        'COUNT(DISTINCT order.id) as times'
      ])
      .where('order.userId = :userId', { userId })
      .andWhere('order.paymentStatus = :status', { status: 'approved' })
      .groupBy('item.productName')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      user,
      statistics: {
        totalOrders: parseInt(orderStats.totalOrders || '0'),
        totalSpent: parseFloat(orderStats.totalSpent || '0'),
        averageOrderValue: parseFloat(orderStats.averageOrderValue || '0'),
        lastOrderDate: lastOrder?.createdAt || null,
        ordersByStatus,
        monthlyOrdersCount: monthlyOrders.map(item => ({
          month: item.month,
          count: parseInt(item.count),
          total: parseFloat(item.total || '0')
        })),
        favoriteProducts: favoriteProducts.map(item => ({
          productName: item.productName,
          quantity: parseInt(item.quantity),
          times: parseInt(item.times)
        }))
      }
    };
  }

  // ✅ NUEVO: Resumen rápido del usuario
  async getUserSummary(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: Date | null;
    memberSince: Date;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Estadísticas básicas
    const orderRepository = this.userRepository.manager.getRepository('Order');
    
    const stats = await orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(order.id) as totalOrders',
        'COALESCE(SUM(order.total), 0) as totalSpent',
      ])
      .where('order.userId = :userId', { userId })
      .andWhere('order.paymentStatus = :status', { status: 'approved' })
      .getRawOne();

    const lastOrder = await orderRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      select: ['createdAt'],
    });

    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.role,
      totalOrders: parseInt(stats.totalOrders || '0'),
      totalSpent: parseFloat(stats.totalSpent || '0'),
      lastOrderDate: lastOrder?.createdAt || null,
      memberSince: user.createdAt,
    };
  }

  // En users.service.ts, agregar este método:
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    user.password_hash = hashedPassword;
    await this.userRepository.save(user);
  }
}

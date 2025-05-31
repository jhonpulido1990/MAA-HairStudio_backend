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

// DTO interno para la creación de usuarios, usado por AuthService
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
    private readonly mailerService: MailerService, // Asegúrate de tener configurado el MailerModule
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
      // Podrías loggear el error `error.code` para depuración
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

  async findOneById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'createdAt', 'updatedAt', 'role'],
    });
    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Omit<User, 'password_hash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'name', 'email', 'createdAt', 'updatedAt', 'role'],
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

  async updateUserRole(
    userId: string,
    newRole: UserRole,
  ): Promise<Omit<User, 'password_hash'>> {
    console.log('Nuevo rol recibido:', newRole, typeof newRole); // <-- Agrega esto

    // Validar que el role sea válido
    if (!Object.values(UserRole).includes(newRole)) {
      throw new BadRequestException('Rol no válido.');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    user.role = newRole;
    await this.userRepository.save(user);

    // Retornar el usuario sin el password_hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;

    await this.userRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
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

  async sendPasswordResetEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    // Genera un token seguro
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
    user.resetPasswordExpires = undefined;

    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User, UserRole } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from 'src/auth/dto/update_user';

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

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    // Selecciona todos los campos excepto password_hash para mayor seguridad.
    // En una aplicación más grande, podrías considerar la paginación aquí.
    const users = await this.userRepository.find({
      select: ['id', 'name', 'email', 'createdAt', 'updatedAt', 'role'], // Especifica los campos a devolver
    });
    // Si no usas `select` en find, puedes mapear para excluir el password_hash:
    // return users.map(({ password_hash, ...userWithoutPassword }) => userWithoutPassword);
    return users;
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
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

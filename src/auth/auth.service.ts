import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/user.entity';
import { InternalCreateUserDto, UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';

export interface JwtPayload {
  id: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Omit<User, 'password_hash'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const { email, password, name } = registerUserDto;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      const userToCreate: InternalCreateUserDto = {
        email,
        password_hash: hashedPassword,
        name,
      };
      const createdUser = await this.usersService.create(userToCreate);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = createdUser;
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error durante el registro:', error);
      throw new InternalServerErrorException(
        'Error al registrar el usuario. Inténtalo de nuevo más tarde.',
      );
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const { email, password } = loginUserDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload: JwtPayload = { id: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userDetails } = user;

    return { accessToken, user: userDetails };
  }

  async validateUserById(
    id: string,
  ): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.usersService.findOneById(id);
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user as User;
    return result;
  }
}

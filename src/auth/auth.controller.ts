import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from 'src/users/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponse> {
    return this.authService.login(loginUserDto);
  }

  // Ejemplo de ruta protegida
  @Get('profile')
  @UseGuards(AuthGuard()) // Usa la estrategia JWT por defecto
  getProfile(@Req() req: import('express').Request) {
    // req.user contendrá el usuario validado por JwtStrategy
    const user = req.user as User;
    return { message: 'Esta es una ruta protegida', user };
  }
}

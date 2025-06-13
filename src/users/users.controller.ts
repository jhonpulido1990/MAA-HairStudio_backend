import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Delete,
  Post,
  Query,
  Req,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from 'src/auth/dto/update_user';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{
    data: Omit<User, 'password_hash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.usersService.findAll(Number(page), Number(limit));
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id/role')
  async updateRole(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<Omit<User, 'password_hash'>> {
    return this.usersService.updateUserRole(id, updateUserRoleDto.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateUser(
    @Req() req: { user: User },
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    return this.usersService.updateUser(req.user, id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteUser(
    @Request() req: { user: User },
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
  ): Promise<{ message: string }> {
    return this.usersService.deleteUser(req.user, id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.sendPasswordResetEmail(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    return this.usersService.resetPassword(token, newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(
    @Req() req: { user: User },
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
  ): Promise<Omit<User, 'password_hash'> | null> {
    return this.usersService.findOneById(req.user, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  async deleteOwnAccount(@Req() req: { user: User }) {
    return this.usersService.deleteOwnAccount(req.user);
  }
}

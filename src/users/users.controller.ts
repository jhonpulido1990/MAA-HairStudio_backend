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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from 'src/auth/dto/update_user';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Request() req: { user: User },
  ): Promise<Omit<User, 'password_hash'>[]> {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<Omit<User, 'password_hash'>> {
    return this.usersService.updateUserRole(id, updateUserRoleDto.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteUser(
    @Request() req: { user: User },
    @Param('id') id: string,
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
}

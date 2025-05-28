import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registra la entidad User
  providers: [UsersService],
  exports: [UsersService], // Exporta UsersService para que AuthModule pueda usarlo
})
export class UsersModule {}

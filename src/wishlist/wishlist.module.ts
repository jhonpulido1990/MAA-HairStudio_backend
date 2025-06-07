import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../products/product.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product, User])],
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}

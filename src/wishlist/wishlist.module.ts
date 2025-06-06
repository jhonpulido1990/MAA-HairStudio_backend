import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../products/product.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product])],
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}

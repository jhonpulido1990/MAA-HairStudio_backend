import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippoService } from './shippo.service';
import { ShippoController } from './shippo.controller';

@Module({
  imports: [ConfigModule],
  providers: [ShippoService],
  controllers: [ShippoController],
  exports: [ShippoService],
})
export class ShippoModule {}

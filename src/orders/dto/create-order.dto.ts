import {
  IsUUID,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../order-status.enum';

class OrderProductDto {
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido.' })
  productId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad mínima es 1.' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'Los items deben ser un arreglo.' })
  @ValidateNested({
    each: true,
    message: 'Cada item debe ser un objeto válido.',
  })
  @Type(() => OrderProductDto)
  items: OrderProductDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus as object, {
    message: 'El estado de la orden no es válido.',
  })
  status: OrderStatus;
}

import { IsString, IsOptional, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../orders.entity';

export class CreateOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'La dirección de envío debe ser un UUID válido.' })
  shippingAddressId?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto.' })
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Estado de orden inválido.' })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  status: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Estado de pago inválido.' })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto.' })
  notes?: string;
}

export class CreateOrderFromCartDto {
  @IsOptional()
  @IsUUID('4', { message: 'La dirección de envío debe ser un UUID válido.' })
  shippingAddressId?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto.' })
  notes?: string;
}

// ✅ AGREGAR: DTO para filtros de admin
export class AdminOrderFiltersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID('4')
  userId?: string;
}
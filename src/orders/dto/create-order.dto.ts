import { 
  IsEnum, 
  IsUUID, 
  IsOptional, 
  IsString, 
  Length,
  ValidateIf,
  IsDecimal,
  IsPositive,
  IsNotEmpty
} from 'class-validator';
import { OrderStatus, PaymentStatus, DeliveryType } from '../orders.entity';

export class CreateOrderFromCartDto {
  @IsEnum(DeliveryType, { 
    message: 'El tipo de entrega debe ser pickup o delivery' 
  })
  deliveryType: DeliveryType;

  @ValidateIf(o => o.deliveryType === DeliveryType.DELIVERY)
  @IsUUID('4', { message: 'El ID de dirección debe ser un UUID v4 válido' })
  shippingAddressId?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @Length(1, 500, { message: 'Las notas deben tener máximo 500 caracteres' })
  notes?: string;
}

export class SetShippingCostDto {
  @IsDecimal({ decimal_digits: '0,2' }, { 
    message: 'El costo de envío debe ser un número decimal válido' 
  })
  @IsPositive({ message: 'El costo de envío debe ser positivo' })
  shippingCost: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @Length(1, 500, { message: 'Las notas deben tener máximo 500 caracteres' })
  shippingNotes?: string;
}

export class ConfirmOrderDto {

  @IsOptional()
  confirm?: boolean = true;
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
  @Length(1, 500, { message: 'Las notas deben tener máximo 500 caracteres' })
  notes?: string;
}

// ✅ DTO adicional para crear orden directa (sin carrito)
export class CreateOrderDto {
  @IsNotEmpty({ message: 'Los items son obligatorios' })
  items: Array<{
    productId: string;
    quantity: number;
  }>;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ValidateIf(o => o.deliveryType === DeliveryType.DELIVERY)
  @IsUUID('4')
  shippingAddressId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
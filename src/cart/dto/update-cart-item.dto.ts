import { IsUUID, IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido.' })
  productId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(0, { message: 'La cantidad no puede ser negativa.' })
  quantity: number;
}

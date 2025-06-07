import { IsUUID, IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido.' })
  productId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad mínima permitida es 1.' })
  quantity: number;
}

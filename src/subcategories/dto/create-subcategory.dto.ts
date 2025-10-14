import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  MaxLength, 
  MinLength,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsHexColor
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubcategoryDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  @Transform(({ value }) => value?.trim()) // ✅ Limpiar espacios
  name: string;

  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El ID de categoría es obligatorio.' })
  categoryId: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres.' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero.' })
  @Min(0, { message: 'El orden debe ser mayor o igual a 0.' })
  @Max(999, { message: 'El orden no puede exceder 999.' })
  displayOrder?: number;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser una URL válida.' })
  @MaxLength(255, { message: 'La URL de imagen es demasiado larga.' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'El icono debe ser una cadena de texto.' })
  @MaxLength(50, { message: 'El icono no puede exceder 50 caracteres.' })
  icon?: string;

  @IsOptional()
  @IsHexColor({ message: 'El color debe ser un código hexadecimal válido (ej: #FF0000).' })
  color?: string;
}

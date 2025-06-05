import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(255, {
    message: 'El nombre no puede tener más de 255 caracteres.',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  price?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock?: number;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser una cadena de texto.' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'La marca debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'La marca no puede tener más de 100 caracteres.' })
  brand?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El peso debe ser un número.' })
  @Min(0, { message: 'El peso no puede ser negativo.' })
  weight?: number;

  @IsOptional()
  @IsString({ message: 'La dimensión debe ser una cadena de texto.' })
  @MaxLength(100, {
    message: 'La dimensión no puede tener más de 100 caracteres.',
  })
  dimension?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El subcategoryId debe ser un UUID válido.' })
  subcategoryId?: string;
}

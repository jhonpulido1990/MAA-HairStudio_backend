import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { ProductCategory } from '../product.entity';

export class CreateProductDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(255, { message: 'El nombre no puede superar los 255 caracteres.' })
  name: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con hasta 2 decimales.' },
  )
  @Min(0, { message: 'El precio no puede ser negativo.' })
  price: number;

  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock: number;

  @IsEnum(ProductCategory, {
    message: 'La categoría debe ser camping, asado, bebidas o vinos.',
  })
  category: ProductCategory;

  @IsString({ message: 'La imagen debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La imagen es obligatoria.' })
  @MaxLength(255, {
    message: 'La URL de la imagen no puede superar los 255 caracteres.',
  })
  image: string;

  @IsOptional()
  @IsString({ message: 'La marca debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'La marca no puede superar los 100 caracteres.' })
  brand?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El peso debe ser un número con hasta 2 decimales.' },
  )
  @Min(0, { message: 'El peso no puede ser negativo.' })
  weight?: number;

  @IsOptional()
  @IsString({ message: 'La dimensión debe ser una cadena de texto.' })
  @MaxLength(100, {
    message: 'La dimensión no puede superar los 100 caracteres.',
  })
  dimension?: string;
}

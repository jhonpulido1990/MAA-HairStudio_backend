import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto, HairType, DesiredResult } from './create-product.dto';
import { 
  IsOptional, 
  IsNumber, 
  Min, 
  IsBoolean,
  IsEnum,
  IsString,
  IsUUID,
  Max
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ✅ Enum para operaciones de stock
export enum StockOperation {
  SET = 'set',
  ADD = 'add',
  SUBTRACT = 'subtract'
}

// ✅ DTO principal que permite actualizar todos los campos
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['subcategoryId'] as const)
) {
  // Permitir cambio de subcategoría
  @IsOptional()
  @IsUUID('4', { message: 'El ID de subcategoría debe ser un UUID v4 válido.' })
  subcategoryId?: string;

  // ✅ OPERACIONES ESPECIALES DE STOCK
  @IsOptional()
  @IsEnum(StockOperation, { 
    message: 'La operación de stock debe ser: set, add, o subtract' 
  })
  stockOperation?: StockOperation;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad debe ser un número entero.' })
  @Min(0, { message: 'La cantidad no puede ser negativa.' })
  @Type(() => Number)
  stockAmount?: number;

  // ✅ CAMPOS DE ANALÍTICAS (solo para admin)
  @IsOptional()
  @IsNumber({}, { message: 'El contador de vistas debe ser un número entero.' })
  @Min(0, { message: 'El contador de vistas no puede ser negativo.' })
  @Type(() => Number)
  viewCount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El contador de compras debe ser un número entero.' })
  @Min(0, { message: 'El contador de compras no puede ser negativo.' })
  @Type(() => Number)
  purchaseCount?: number;

  @IsOptional()
  @IsString({ message: 'La razón debe ser una cadena de texto.' })
  @Transform(({ value }) => value?.trim())
  reason?: string;
}

// ✅ DTO especializado para filtros avanzados
export class ProductFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID('4')
  subcategoryId?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  // ✅ NUEVO FILTRO: COLLECTION
  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsEnum(HairType)
  type_hair?: HairType;

  @IsOptional()
  @IsEnum(DesiredResult)
  desired_result?: DesiredResult;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isOnSale?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  inStock?: boolean;

  @IsOptional()
  @IsEnum(['name', 'price', 'rating', 'createdAt', 'popularity'], {
    message: 'sortBy debe ser: name, price, rating, createdAt, o popularity'
  })
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt' | 'popularity';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export { HairType, DesiredResult };

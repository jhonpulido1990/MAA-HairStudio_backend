import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubcategoryDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name: string;

  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido.' })
  categoryId: string;
}

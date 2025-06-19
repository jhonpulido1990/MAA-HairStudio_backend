import { IsString, IsNotEmpty } from 'class-validator';

export class IdDto {
  @IsString({ message: 'El id debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El id no puede estar vacío.' })
  id: string;
}

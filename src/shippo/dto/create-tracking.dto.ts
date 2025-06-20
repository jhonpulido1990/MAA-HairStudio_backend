import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateTrackingDto {
  @IsString({
    message: 'El número de seguimiento debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'El número de seguimiento es obligatorio.' })
  @Length(5, 50, {
    message: 'El número de seguimiento debe tener entre 5 y 50 caracteres.',
  })
  trackingNumber: string;

  @IsString({
    message: 'El nombre del transportista debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'El nombre del transportista es obligatorio.' })
  @Length(2, 30, {
    message: 'El nombre del transportista debe tener entre 2 y 30 caracteres.',
  })
  carrier: string;
}

import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ShipmentCreateRequest } from 'shippo';

export class ComprarEtiquetaDto {
  @IsString({ message: 'El shipmentId debe ser un string.' })
  @IsNotEmpty({ message: 'El shipmentId es obligatorio.' })
  @Length(5, 50, {
    message: 'El número de seguimiento debe tener entre 5 y 50 caracteres.',
  })
  shipmentId: ShipmentCreateRequest | string;

  @IsString({ message: 'El rateId debe ser un string.' })
  @IsNotEmpty({ message: 'El rateId es obligatorio.' })
  rateId: string;
}

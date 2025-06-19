import { IsNotEmpty, IsObject, IsArray } from 'class-validator';

export class GetRatesDto {
  @IsNotEmpty({ message: 'El campo address_from es obligatorio.' })
  @IsObject({ message: 'El campo address_from debe ser un objeto.' })
  address_from: any;

  @IsNotEmpty({ message: 'El campo address_to es obligatorio.' })
  @IsObject({ message: 'El campo address_to debe ser un objeto.' })
  address_to: any;

  @IsNotEmpty({ message: 'El campo parcels es obligatorio.' })
  @IsArray({ message: 'El campo parcels debe ser un arreglo.' })
  parcels: any;
}

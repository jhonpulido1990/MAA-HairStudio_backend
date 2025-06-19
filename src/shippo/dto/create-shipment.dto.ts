import {
  IsArray,
  IsOptional,
  IsBoolean,
  ArrayNotEmpty,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import {
  AddressCreateRequest$Outbound,
  ParcelCreateFromTemplateRequest$Outbound,
  ParcelCreateRequest$Outbound,
} from 'shippo';

export class CreateShipmentDto {
  @IsString({
    message: 'El campo addressFrom debe ser un string o un objeto válido.',
  })
  @IsNotEmpty({ message: 'El campo addressFrom no puede estar vacío.' })
  addressFrom: AddressCreateRequest$Outbound | string;

  @IsString({
    message: 'El campo addressTo debe ser un string o un objeto válido.',
  })
  @IsNotEmpty({ message: 'El campo addressTo no puede estar vacío.' })
  addressTo: AddressCreateRequest$Outbound | string;

  @IsArray({ message: 'El campo parcels debe ser un arreglo válido.' })
  @ArrayNotEmpty({ message: 'El campo parcels no puede estar vacío.' })
  parcels: Array<
    | ParcelCreateFromTemplateRequest$Outbound
    | ParcelCreateRequest$Outbound
    | string
  >;

  @IsOptional()
  @IsBoolean({ message: 'El campo async debe ser un valor booleano.' })
  async?: boolean | undefined;
}

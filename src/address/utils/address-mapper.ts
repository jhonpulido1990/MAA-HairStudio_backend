import { CreateAddressDto as InternalAddressDto } from '../dto/create-address.dto';
import { CreateAddressDto as ShippoAddressDto } from '../../shippo/dto/create-address.dto';

export function mapToShippoAddress(dto: InternalAddressDto): ShippoAddressDto {
  return {
    name: dto.nombreCompleto,
    street1: dto.direccionLinea1,
    city: dto.ciudad,
    state: dto.departamento,
    zip: dto.codigoPostal,
    country: dto.pais,
    phone: dto.telefono,
    email: dto.email,
  };
}

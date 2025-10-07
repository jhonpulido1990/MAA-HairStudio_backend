/* import { CreateAddressDto1 as InternalAddressDto } from '../dto/create-address.dto';
import { CreateAddressDto as ShippoAddressDto } from '../../shippo/dto/create-address.dto';
 */
/**
 * Mapea una dirección interna al formato requerido por Shippo.
 * Asegúrate de que los valores como 'country' estén en formato ISO 3166-1 alpha-2.
 */
/* export function mapToShippoAddress(dto: InternalAddressDto): ShippoAddressDto {
  return {
    name: dto.nombreCompleto,
    street1: dto.direccionLinea1,
    street2: dto.direccionLinea2 ?? undefined, // Opcional
    city: dto.ciudad,
    state: dto.departamento,
    zip: dto.codigoPostal,
    country: dto.pais, // Debe ser código de 2 letras
    phone: dto.telefono ?? undefined,
    email: dto.email ?? undefined,
  };
} */

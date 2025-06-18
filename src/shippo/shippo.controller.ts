import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ShippoService } from './shippo.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { GetRatesDto } from './dto/get-rates.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';

@Controller('shippo')
/**
 * Controlador ShippoController
 *
 * Expone endpoints para gestionar direcciones, tarifas, envíos, etiquetas, trackings, paquetes y carriers
 * utilizando los servicios de Shippo.
 *
 * Métodos:
 *
 * - crearDireccion: Crea una nueva dirección a partir de los datos proporcionados.
 * - validarDireccion: Valida una dirección antes de utilizarla en un envío.
 * - obtenerTarifas: Obtiene las tarifas de envío disponibles según los datos proporcionados.
 * - crearEnvio: Crea un nuevo envío con la información suministrada.
 * - obtenerEnvio: Obtiene los detalles de un envío específico por su ID.
 * - comprarEtiqueta: Compra una etiqueta de envío para un shipment y rate específicos.
 * - obtenerEtiqueta: Obtiene la información de una etiqueta de envío por su ID.
 * - crearTracking: Crea un tracking para un número de envío y carrier determinados.
 * - obtenerTracking: Obtiene la información de tracking de un envío por su ID.
 * - crearPaquete: Crea un nuevo paquete (parcel) con las dimensiones y peso especificados.
 * - listarCarriers: Lista los carriers disponibles para realizar envíos.
 */
export class ShippoController {
  constructor(private readonly shippoService: ShippoService) {}

  @Post('direccion')
  crearDireccion(@Body() dto: CreateAddressDto) {
    return this.shippoService.crearDireccion(dto);
  }

  @Post('direccion/validar')
  validarDireccion(@Body() dto: CreateAddressDto) {
    return this.shippoService.validarDireccion(dto);
  }

  @Post('tarifas')
  obtenerTarifas(@Body() dto: GetRatesDto) {
    return this.shippoService.obtenerTarifas(dto);
  }

  @Post('envio')
  crearEnvio(@Body() dto: CreateShipmentDto) {
    return this.shippoService.crearEnvio(dto);
  }

  @Get('envio/:id')
  obtenerEnvio(@Param('id') id: string) {
    return this.shippoService.obtenerEnvio(id);
  }

  @Post('etiqueta/comprar')
  comprarEtiqueta(@Body() body: { shipmentId: string; rateId: string }) {
    return this.shippoService.comprarEtiqueta(body.shipmentId, body.rateId);
  }

  @Get('etiqueta/:id')
  obtenerEtiqueta(@Param('id') id: string) {
    return this.shippoService.obtenerEtiqueta(id);
  }

  @Post('tracking')
  crearTracking(@Body() body: { numero: string; carrier: string }) {
    return this.shippoService.crearTracking(body.numero, body.carrier);
  }

  @Get('tracking/:id')
  obtenerTracking(@Param('id') id: string) {
    return this.shippoService.obtenerTracking(id);
  }

  @Post('paquete')
  crearPaquete(@Body() dto: CreateParcelDto) {
    return this.shippoService.crearPaquete(dto);
  }

  @Get('carriers')
  listarCarriers() {
    return this.shippoService.listarCarriers();
  }
}

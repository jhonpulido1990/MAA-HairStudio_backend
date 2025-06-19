import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ShippoService } from './shippo.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { ShipmentCreateRequest } from 'shippo';
import { IdDto } from './dto/id.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
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
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  crearDireccion(@Body() dto: CreateAddressDto) {
    return this.shippoService.crearDireccion(dto);
  }

  @Post('direccion/validar')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  validarDireccion(@Body() body: IdDto) {
    return this.shippoService.validarDireccion(body.id);
  }

  @Post('tarifas')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  obtenerTarifas(@Body() body: IdDto) {
    return this.shippoService.obtenerTarifas(body.id);
  }

  @Post('envio')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  crearEnvio(@Body() dto: CreateShipmentDto) {
    // Aquí puedes mapear dto a ShipmentCreateRequest si necesitas
    return this.shippoService.crearEnvio(dto as any);
  }

  @Post('envio/obtener')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  obtenerEnvio(@Body() body: IdDto) {
    return this.shippoService.obtenerEnvio(body.id);
  }

  // Solo admin puede comprar etiquetas
  @Roles('admin')
  @Post('etiqueta/comprar')
  comprarEtiqueta(
    @Body() body: { shipmentId: ShipmentCreateRequest; rateId: string },
  ) {
    return this.shippoService.comprarEtiqueta(body.shipmentId, body.rateId);
  }

  @Get('etiqueta/:id')
  obtenerEtiqueta(@Param('id') id: string) {
    return this.shippoService.obtenerEtiqueta(id);
  }

  @Post('tracking')
  crearTracking(@Body() body: { trackingNumber: string; carrier: string }) {
    return this.shippoService.crearTracking(body.trackingNumber, body.carrier);
  }

  @Get('tracking/:id/:carrier')
  obtenerTracking(@Param('id') id: string, @Param('carrier') carrier: string) {
    return this.shippoService.obtenerTracking(id, carrier);
  }

  @Post('paquete')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  crearPaquete(@Body() dto: CreateParcelDto) {
    return this.shippoService.crearPaquete(dto as any);
  }

  // solo admin puede listar carriers
  @Roles('admin')
  @Get('carriers')
  listarCarriers() {
    return this.shippoService.listarCarriers();
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
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
import { ComprarEtiquetaDto } from './dto/create-etiqueta.dto';
import { CreateParcelRequestBody } from 'shippo/models/operations';
import { CreateTrackingDto } from './dto/create-tracking.dto';

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
    return this.shippoService.crearEnvio(dto as ShipmentCreateRequest);
  }

  @Post('envio/obtener')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  obtenerEnvio(@Body() body: IdDto) {
    return this.shippoService.obtenerEnvio(body.id);
  }

  // Solo admin puede comprar etiquetas
  @Roles('admin')
  @Post('etiqueta/comprar')
  comprarEtiqueta(@Body() body: ComprarEtiquetaDto) {
    return this.shippoService.comprarEtiqueta(
      body.shipmentId as ShipmentCreateRequest,
      body.rateId,
    );
  }

  @Post('etiqueta/obtener')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  obtenerEtiqueta(@Body() body: IdDto) {
    return this.shippoService.obtenerEtiqueta(body.id);
  }

  @Post('tracking')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  crearTracking(@Body() body: CreateTrackingDto) {
    return this.shippoService.crearTracking(body.trackingNumber, body.carrier);
  }

  @Post('tracking/obtener')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  obtenerTracking(@Body() body: CreateTrackingDto) {
    return this.shippoService.obtenerTracking(
      body.trackingNumber,
      body.carrier,
    );
  }

  @Post('paquete')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  crearPaquete(@Body() dto: CreateParcelDto) {
    return this.shippoService.crearPaquete(dto as CreateParcelRequestBody);
  }

  // solo admin puede listar carriers
  @Roles('admin')
  @Get('carriers')
  listarCarriers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.shippoService.listarCarriers(Number(page), Number(limit));
  }
}

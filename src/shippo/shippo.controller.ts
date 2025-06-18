import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ShippoService } from './shippo.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { GetRatesDto } from './dto/get-rates.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';

@Controller('shippo')
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

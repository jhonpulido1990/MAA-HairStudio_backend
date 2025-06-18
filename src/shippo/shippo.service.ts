import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Cambia la importación de Shippo a require y tipa la función
import { Shippo } from 'shippo';
import { CreateAddressDto } from './dto/create-address.dto';
import { GetRatesDto } from './dto/get-rates.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';

@Injectable()
export class ShippoService {
  private shippoClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SHIPPO_API_KEY');
    if (!apiKey) {
      throw new Error('SHIPPO_API_KEY no está definido en el .env');
    }
    this.shippoClient = new Shippo({ apiKeyHeader: apiKey });
  }

  async crearDireccion(data: CreateAddressDto) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return await this.shippoClient.address.create(data);
  }

  async validarDireccion(idOrData: string | CreateAddressDto) {
    return await this.shippoClient.address.validate(idOrData);
  }

  async obtenerTarifas(data: GetRatesDto) {
    return await this.shippoClient.shipment.getRates(data);
  }

  async crearEnvio(data: CreateShipmentDto) {
    return await this.shippoClient.shipment.create(data);
  }

  async obtenerEnvio(id: string) {
    return await this.shippoClient.shipment.retrieve(id);
  }

  async comprarEtiqueta(shipmentId: string, rateId: string) {
    return await this.shippoClient.transaction.create({
      shipment: shipmentId,
      rate: rateId,
      label_file_type: 'PDF',
      async: false,
    });
  }

  async obtenerEtiqueta(transactionId: string) {
    const transaction =
      await this.shippoClient.transaction.retrieve(transactionId);
    return transaction.label_url;
  }

  async crearTracking(numero: string, carrier: string) {
    return await this.shippoClient.track.create({
      carrier,
      tracking_number: numero,
    });
  }

  async obtenerTracking(id: string) {
    return await this.shippoClient.track.get(id);
  }

  async crearPaquete(data: CreateParcelDto) {
    return await this.shippoClient.parcel.create(data);
  }

  async listarCarriers() {
    return await this.shippoClient.carrieraccount.list();
  }
}

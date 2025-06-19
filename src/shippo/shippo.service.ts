import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAddressDto } from './dto/create-address.dto';
import { ShipmentCreateRequest, Shippo } from 'shippo';
import { CreateParcelRequestBody } from 'shippo/models/operations';

@Injectable()
export class ShippoService {
  private shippoClient: Shippo;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SHIPPO_API_KEY');
    if (!apiKey) {
      throw new Error('SHIPPO_API_KEY no está definido en el .env');
    }
    this.shippoClient = new Shippo({ apiKeyHeader: apiKey });
  }

  async crearDireccion(data: CreateAddressDto) {
    try {
      return await this.shippoClient.addresses.create(data);
    } catch (error) {
      const status = (error as { status?: number; statusCode?: number })
        ?.status;
      const statusCode = (error as { status?: number; statusCode?: number })
        ?.statusCode;
      if (status === 404 || statusCode === 404) {
        throw new NotFoundException(
          'Dirección no pudo ser creada en Shippo, revisa los datos enviados.',
        );
      }
      throw new InternalServerErrorException(
        'Error al crear dirección en Shippo',
      );
    }
  }

  async validarDireccion(id: string) {
    try {
      return await this.shippoClient.addresses.validate(id);
    } catch (error) {
      const status = (error as { status?: number; statusCode?: number })
        ?.status;
      const statusCode = (error as { status?: number; statusCode?: number })
        ?.statusCode;
      if (status === 404 || statusCode === 404) {
        throw new NotFoundException('Dirección no encontrada en Shippo');
      }
      throw new InternalServerErrorException(
        'Error al validar dirección en Shippo',
      );
    }
  }

  async obtenerTarifas(shipmentId: string) {
    try {
      return await this.shippoClient.shipments.get(shipmentId);
    } catch (error) {
      const status = (error as { status?: number; statusCode?: number })
        ?.status;
      const statusCode = (error as { status?: number; statusCode?: number })
        ?.statusCode;
      if (status === 404 || statusCode === 404) {
        throw new NotFoundException('Tarifa no encontrada en Shippo');
      }
      throw new InternalServerErrorException(
        'Error al validar la tarifa en Shippo',
      );
    }
  }

  async crearEnvio(data: ShipmentCreateRequest) {
    try {
      return await this.shippoClient.shipments.create(data);
    } catch (error) {
      const status = (error as { status?: number; statusCode?: number })
        ?.status;
      const statusCode = (error as { status?: number; statusCode?: number })
        ?.statusCode;

      if (status === 404 || statusCode === 404) {
        throw new NotFoundException(
          'No se encontró alguno de los recursos (dirección o paquete) en Shippo. Verifica que los IDs enviados sean correctos.',
        );
      }

      // Puedes agregar más lógica para otros códigos de error si Shippo los provee

      throw new InternalServerErrorException(
        'No se pudo crear el envío. Verifica que las direcciones y el paquete sean válidos o intenta nuevamente más tarde.',
      );
    }
  }

  async obtenerEnvio(id: string) {
    try {
      return await this.shippoClient.shipments.get(id);
    } catch (error) {
      const status = (error as { status?: number; statusCode?: number })
        ?.status;
      const statusCode = (error as { status?: number; statusCode?: number })
        ?.statusCode;
      if (status === 404 || statusCode === 404) {
        throw new NotFoundException('Envio no encontrado en Shippo');
      }
      throw new InternalServerErrorException(
        'Error al Buscar el Id del envio en Shippo',
      );
    }
  }

  async comprarEtiqueta(shipmentId: ShipmentCreateRequest, rateId: string) {
    return await this.shippoClient.transactions.create({
      shipment: shipmentId,
      rate: rateId,
      labelFileType: 'PDF',
      async: false,
    });
  }

  async obtenerEtiqueta(transactionId: string) {
    const transaction = await this.shippoClient.transactions.get(transactionId);
    return transaction.labelUrl;
  }

  async crearTracking(numero: string, carrier: string) {
    return await this.shippoClient.trackingStatus.create({
      carrier,
      trackingNumber: numero,
    });
  }

  async obtenerTracking(id: string, carrier: string) {
    return await this.shippoClient.trackingStatus.get(id, carrier);
  }

  async crearPaquete(data: CreateParcelRequestBody) {
    try {
      return await this.shippoClient.parcels.create(data);
    } catch (error) {
      const status = (error as { status?: number; statusCode?: number })
        ?.status;
      const statusCode = (error as { status?: number; statusCode?: number })
        ?.statusCode;
      if (status === 404 || statusCode === 404) {
        throw new NotFoundException(
          'No se ha podido crear el paquete por falta de datos o datos incorrectos en Shippo',
        );
      }
      throw new InternalServerErrorException(
        'Error al crear el paquete en Shippo',
      );
    }
  }

  async listarCarriers(page: number = 1, results: number = 10) {
    return await this.shippoClient.carrierAccounts.list({
      page: page,
      results: results,
    });
  }
}

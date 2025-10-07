import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto1 } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { User } from '../users/user.entity';
/* import { ShippoService } from '../shippo/shippo.service';
 */
/* import { mapToShippoAddress } from './utils/address-mapper'; */

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    /* private readonly shippoService: ShippoService, */
  ) {}

 /*  async create(user: User, dto: CreateAddressDto1): Promise<Address> {
    // 1. Mapea tu DTO al formato Shippo
    const shippoDto = mapToShippoAddress(dto);

    // 2. crear la dirección en Shippo
    const shippoAddress = await this.shippoService.crearDireccion(shippoDto);
    console.log('Shippo Address:', shippoAddress);
    if (!shippoAddress) {
      throw new BadRequestException('Error al crear la dirección en Shippo.');
    }

    // 3. Valida la dirección con Shippo
    const validatedAddress = await this.shippoService.validarDireccion(
      shippoAddress.objectId || '',
    );
    console.log('Validated Address:', validatedAddress);
    if (!validatedAddress) {
      throw new BadRequestException('Dirección no válida según Shippo.');
    }

    // Guarda el objectId de Shippo en tu base de datos
    const address = this.addressRepository.create({
      ...dto,
      user,
      shippoObjectId: shippoAddress.objectId, // <--- aquí lo guardas
    });
    if (dto.esPrincipal) {
      await this.addressRepository.update({ user }, { esPrincipal: false });
    }
    return this.addressRepository.save(address);
  } */

  async findAll(user: User): Promise<Address[]> {
    return this.addressRepository.find({ where: { user: { id: user.id } } });
  }

  async findOne(user: User, id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!address) throw new NotFoundException('Dirección no encontrada.');
    return address;
  }

  async update(
    user: User,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(user, id);

    // Si es principal, actualiza las demás
    if (dto.esPrincipal) {
      await this.addressRepository.update({ user }, { esPrincipal: false });
    }

    // Combina los datos existentes con los nuevos
    const fullData = { ...address, ...dto };

    // Mapea y crea la nueva dirección en Shippo con todos los datos completos
    /* const shippoDto = mapToShippoAddress(fullData as CreateAddressDto1);
    console.log('Shippo DTO:', shippoDto); */

    /* const shippoAddress = await this.shippoService.crearDireccion(shippoDto);
    if (!shippoAddress) {
      throw new BadRequestException('Error al crear la dirección en Shippo.');
    }

    const validatedAddress = await this.shippoService.validarDireccion(
      shippoAddress.objectId || '',
    ); */
   /*  if (!validatedAddress) {
      throw new BadRequestException('Dirección no válida según Shippo.');
    } */

   /*  Object.assign(address, dto, { shippoObjectId: shippoAddress.objectId }); */

    return this.addressRepository.save(address);
  }

  async remove(user: User, id: string): Promise<{ message: string }> {
    const address = await this.findOne(user, id);
    await this.addressRepository.delete(address.id);
    return { message: 'Dirección eliminada correctamente.' };
  }

  async setPrincipal(user: User, id: string): Promise<Address> {
    const address = await this.findOne(user, id);
    await this.addressRepository.update({ user }, { esPrincipal: false });
    address.esPrincipal = true;
    return this.addressRepository.save(address);
  }
}

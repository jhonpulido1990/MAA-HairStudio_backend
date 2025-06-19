import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { User } from '../users/user.entity';
import { ShippoService } from '../shippo/shippo.service'; // Importa ShippoService
/* import { mapToShippoAddress } from './utils/address-mapper'; */

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly shippoService: ShippoService, // Inyecta ShippoService
  ) {}

  async create(user: User, dto: CreateAddressDto): Promise<Address> {
    // 1. Mapea tu DTO al formato Shippo
    /* const shippoDto = mapToShippoAddress(dto); */

    // 2. Valida la dirección con Shippo
    /* const validation = await this.shippoService.validarDireccion(shippoDto);
    if (!validation?.validation_results?.is_valid) {
      throw new BadRequestException('Dirección inválida según Shippo');
    }
 */
    // 3. Guarda la dirección en tu base de datos
    const address = this.addressRepository.create({ ...dto, user });
    if (dto.esPrincipal) {
      await this.addressRepository.update({ user }, { esPrincipal: false });
    }
    return this.addressRepository.save(address);
  }

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
    if (dto.esPrincipal) {
      await this.addressRepository.update({ user }, { esPrincipal: false });
    }
    Object.assign(address, dto);
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

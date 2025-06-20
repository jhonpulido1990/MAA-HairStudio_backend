import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddressService } from './address.service';
import { CreateAddressDto1 } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Request } from 'express';
import { User } from '../users/user.entity';

interface AuthRequest extends Request {
  user: User;
}

@UseGuards(AuthGuard('jwt'))
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async create(@Req() req: AuthRequest, @Body() dto: CreateAddressDto1) {
    return this.addressService.create(req.user, dto);
  }

  @Get()
  async findAll(@Req() req: AuthRequest) {
    return this.addressService.findAll(req.user);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
  ) {
    return this.addressService.findOne(req.user, id);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(req.user, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
  ) {
    return this.addressService.remove(req.user, id);
  }

  @Patch(':id/principal')
  async setPrincipal(
    @Req() req: AuthRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException('El id debe tener formato UUID v4 válido.'),
      }),
    )
    id: string,
  ) {
    return this.addressService.setPrincipal(req.user, id);
  }
}

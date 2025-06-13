import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateSubcategoryDto) {
    return this.subcategoriesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.subcategoriesService.findAll();
  }

  @Get(':id')
  async findOne(
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
    return this.subcategoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(
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
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.subcategoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(
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
    return this.subcategoriesService.remove(id);
  }
}

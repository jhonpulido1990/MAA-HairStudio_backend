import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // ✅ MEJORADO: findAll con filtros y paginación
  @Get()
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
    @Query('includeSubcategories', new ParseBoolPipe({ optional: true })) includeSubcategories = true,
  ) {
    return this.categoriesService.findAll(page, limit, search, includeSubcategories);
  }

  // ✅ NUEVO: Endpoint para obtener categorías sin paginación (para selects)
  @Get('all')
  async findAllForSelect() {
    return this.categoriesService.findAllForSelect();
  }

  // ✅ NUEVO: Estadísticas de categorías
  @Get('statistics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  async getStatistics() {
    return this.categoriesService.getCategoriesStats();
  }

  // ✅ NUEVO: Buscar por slug
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () =>
        new BadRequestException('El id debe tener formato UUID v4 válido.'),
    })) id: string,
  ) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  async update(
    @Param('id', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () =>
        new BadRequestException('El id debe tener formato UUID v4 válido.'),
    })) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  // ✅ NUEVO: Reordenar categorías
  @Patch('reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  async reorderCategories(
    @Body() categoryOrders: Array<{ id: string; displayOrder: number }>,
  ) {
    return this.categoriesService.reorderCategories(categoryOrders);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  async remove(
    @Param('id', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () =>
        new BadRequestException('El id debe tener formato UUID v4 válido.'),
    })) id: string,
  ) {
    return this.categoriesService.remove(id);
  }
}

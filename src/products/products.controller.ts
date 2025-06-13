import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.productsService.findAll(Number(page), Number(limit));
  }

  @Get('/search')
  async findByFilters(
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('brand') brand?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productsService.findByFilters(
      name,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      brand,
      Number(page),
      Number(limit),
    );
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
  ): Promise<Product> {
    return this.productsService.findOneById(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  @Patch(':id')
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
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'custom')
  @Delete(':id')
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
  ): Promise<{ message: string }> {
    return this.productsService.remove(id);
  }

  @Get('/by-category/:categoryId')
  async findByCategory(
    @Param(
      'categoryId',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException(
            'El categoryId debe tener formato UUID v4 válido.',
          ),
      }),
    )
    categoryId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productsService.findByCategory(
      categoryId,
      Number(page),
      Number(limit),
    );
  }

  @Get('/by-subcategory/:subcategoryId')
  async findBySubcategory(
    @Param(
      'subcategoryId',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: 400,
        exceptionFactory: () =>
          new BadRequestException(
            'El subcategoryId debe tener formato UUID v4 válido.',
          ),
      }),
    )
    subcategoryId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productsService.findBySubcategory(
      subcategoryId,
      Number(page),
      Number(limit),
    );
  }
}

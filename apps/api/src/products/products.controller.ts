import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/search')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  search(@Query('q') q?: string) {
    return this.productsService.search(q || '');
  }
}

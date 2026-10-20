import { Controller, Get, Param, Query } from '@nestjs/common';
import { StoresService } from './stores.service';

@Controller('api/stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Get()
  findAll(@Query('q') q?: string, @Query('category') category?: string) {
    return this.storesService.findAll({ q, category });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }
}

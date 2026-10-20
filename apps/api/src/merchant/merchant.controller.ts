import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
@Controller('api/merchant')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('summary')
  getSummary(@CurrentUser('id') userId: number) {
    return this.merchantService.getSummary(userId);
  }

  @Get('store')
  getStore(@CurrentUser('id') userId: number) {
    return this.merchantService.getStore(userId);
  }

  @Put('store')
  updateStore(@CurrentUser('id') userId: number, @Body() body: any) {
    return this.merchantService.updateStore(userId, body);
  }

  @Get('products')
  getProducts(@CurrentUser('id') userId: number) {
    return this.merchantService.getProducts(userId);
  }

  @Post('products')
  createProduct(@CurrentUser('id') userId: number, @Body() body: any) {
    return this.merchantService.createProduct(userId, body);
  }

  @Put('products/:id')
  updateProduct(@CurrentUser('id') userId: number, @Param('id') id: string, @Body() body: any) {
    return this.merchantService.updateProduct(userId, parseInt(id, 10), body);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser('id') userId: number, @Param('id') id: string) {
    return this.merchantService.deleteProduct(userId, parseInt(id, 10));
  }

  @Get('orders')
  getOrders(@CurrentUser('id') userId: number, @Query('status') status?: string) {
    return this.merchantService.getOrders(userId, status);
  }

  @Post('orders/:id/status')
  updateOrderStatus(
    @CurrentUser('id') userId: number,
    @Param('id') orderId: string,
    @Body('status') nextStatus: string,
    @Body('bags') bags?: number,
    @Body('note') note?: string,
  ) {
    return this.merchantService.updateOrderStatus(userId, parseInt(orderId, 10), nextStatus, bags, note);
  }

  @Get('payouts')
  getPayouts(@CurrentUser('id') userId: number) {
    return this.merchantService.getPayouts(userId);
  }

  @Post('stripe/onboard')
  stripeOnboard(@CurrentUser('id') userId: number, @Body('return_url') returnUrl?: string) {
    return this.merchantService.onboardStripe(userId, returnUrl || 'http://localhost:3001/merchant/payouts');
  }
}

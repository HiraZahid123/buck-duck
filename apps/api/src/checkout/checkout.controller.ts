import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/checkout')
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Post('quote')
  quote(@Body() body: { items: Array<{ product_id: number; qty: number }>; tip_cents?: number }) {
    return this.checkoutService.calculateQuote(body.items, body.tip_cents);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  checkout(@CurrentUser('id') userId: number, @Body() body: any) {
    return this.checkoutService.createCheckout(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm')
  confirm(
    @CurrentUser('id') userId: number,
    @Param('id') checkoutId: string,
    @Body('payment_method') paymentMethod?: string,
  ) {
    return this.checkoutService.confirmCheckout(userId, parseInt(checkoutId, 10), paymentMethod);
  }
}

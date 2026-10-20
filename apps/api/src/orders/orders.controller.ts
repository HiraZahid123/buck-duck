import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  getCustomerOrders(@CurrentUser('id') userId: number) {
    return this.ordersService.getCustomerOrders(userId);
  }

  @Get(':id')
  getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(parseInt(id, 10), user);
  }

  @Post(':id/cancel')
  cancelOrder(@CurrentUser('id') userId: number, @Param('id') id: string) {
    return this.ordersService.cancelOrder(parseInt(id, 10), userId);
  }
}

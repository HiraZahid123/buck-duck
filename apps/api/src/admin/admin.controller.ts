import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('stores')
  getStores() {
    return this.adminService.getStores();
  }

  @Post('stores/:id')
  updateStore(@Param('id') storeId: string, @Body() body: any) {
    return this.adminService.updateStore(parseInt(storeId, 10), body);
  }

  @Get('users')
  getUsers(@Query('role') role?: string, @Query('q') q?: string) {
    return this.adminService.getUsers(role, q);
  }

  @Post('users/:id')
  updateUserStatus(@Param('id') userId: string, @Body('status') status: string) {
    return this.adminService.updateUserStatus(parseInt(userId, 10), status);
  }

  @Get('orders')
  getOrders(@Query('status') status?: string, @Query('q') q?: string) {
    return this.adminService.getOrders(status, q);
  }

  @Post('orders/:id')
  updateOrder(@Param('id') orderId: string, @Body() body: any) {
    return this.adminService.updateOrder(parseInt(orderId, 10), body);
  }

  @Post('orders/:id/refund')
  refundOrder(
    @Param('id') orderId: string,
    @Body('amount_cents') amountCents?: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.refundOrder(parseInt(orderId, 10), amountCents, reason);
  }

  @Get('drivers')
  getDrivers() {
    return this.adminService.getDrivers();
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() body: Record<string, string>) {
    return this.adminService.updateSettings(body);
  }

  @Get('finance')
  getFinance() {
    return this.adminService.getFinance();
  }
}

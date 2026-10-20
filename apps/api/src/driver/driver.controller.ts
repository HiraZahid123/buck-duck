import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
@Controller('api/driver')
export class DriverController {
  constructor(private driverService: DriverService) {}

  @Get('summary')
  getSummary(@CurrentUser('id') driverId: number) {
    return this.driverService.getSummary(driverId);
  }

  @Post('online')
  toggleOnline(@CurrentUser('id') driverId: number, @Body('online') online: boolean) {
    return this.driverService.toggleOnline(driverId, online);
  }

  @Get('available')
  getAvailableJobs() {
    return this.driverService.getAvailableJobs();
  }

  @Get('route')
  getMyRoute(@CurrentUser('id') driverId: number) {
    return this.driverService.getMyRoute(driverId);
  }

  @Post('orders/:id/claim')
  claimJob(@CurrentUser('id') driverId: number, @Param('id') orderId: string) {
    return this.driverService.claimJob(driverId, parseInt(orderId, 10));
  }

  @Post('orders/:id/release')
  releaseJob(@CurrentUser('id') driverId: number, @Param('id') orderId: string) {
    return this.driverService.releaseJob(driverId, parseInt(orderId, 10));
  }

  @Post('orders/:id/status')
  updateStatus(
    @CurrentUser('id') driverId: number,
    @Param('id') orderId: string,
    @Body('status') status: string,
    @Body('proof_note') proofNote?: string,
    @Body('photo_url') photoUrl?: string,
  ) {
    return this.driverService.updateStatus(driverId, parseInt(orderId, 10), status, proofNote, photoUrl);
  }

  @Get('history')
  getHistory(@CurrentUser('id') driverId: number) {
    return this.driverService.getHistory(driverId);
  }
}

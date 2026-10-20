import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { WindowsModule } from './windows/windows.module';
import { CheckoutModule } from './checkout/checkout.module';
import { OrdersModule } from './orders/orders.module';
import { MerchantModule } from './merchant/merchant.module';
import { DriverModule } from './driver/driver.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    WindowsModule,
    CheckoutModule,
    OrdersModule,
    MerchantModule,
    DriverModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

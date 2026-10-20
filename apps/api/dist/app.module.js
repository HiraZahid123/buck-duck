"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const events_module_1 = require("./events/events.module");
const auth_module_1 = require("./auth/auth.module");
const stores_module_1 = require("./stores/stores.module");
const products_module_1 = require("./products/products.module");
const windows_module_1 = require("./windows/windows.module");
const checkout_module_1 = require("./checkout/checkout.module");
const orders_module_1 = require("./orders/orders.module");
const merchant_module_1 = require("./merchant/merchant.module");
const driver_module_1 = require("./driver/driver.module");
const admin_module_1 = require("./admin/admin.module");
const app_controller_1 = require("./app.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            events_module_1.EventsModule,
            auth_module_1.AuthModule,
            stores_module_1.StoresModule,
            products_module_1.ProductsModule,
            windows_module_1.WindowsModule,
            checkout_module_1.CheckoutModule,
            orders_module_1.OrdersModule,
            merchant_module_1.MerchantModule,
            driver_module_1.DriverModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
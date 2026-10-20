"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const windows_service_1 = require("./windows/windows.service");
let AppController = class AppController {
    constructor(windowsService) {
        this.windowsService = windowsService;
    }
    async getConfig() {
        const windowsData = await this.windowsService.getWindows();
        const nextOpen = windowsData.windows.find((w) => w.open) || windowsData.windows[0] || null;
        return {
            brand: 'BuckDuck',
            marketplace: 'StoreFront USA',
            pilot_zone: 'Silver Spring, MD (Eastern Time)',
            demo: process.env.DEMO_MODE === 'true',
            delivery_weekday: 6,
            delivery_fee_cents: 599,
            service_fee_rate: 0.05,
            min_order_cents: 1500,
            next_window: nextOpen,
            payments: {
                mode: process.env.STRIPE_SECRET_KEY ? 'stripe' : 'demo',
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
                country: 'US',
                currency: 'usd',
            },
        };
    }
    getHealth() {
        return { ok: true, timestamp: new Date().toISOString() };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('healthz'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [windows_service_1.WindowsService])
], AppController);
//# sourceMappingURL=app.controller.js.map
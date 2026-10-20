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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let EventsGateway = class EventsGateway {
    handleConnection(client) {
    }
    handleDisconnect(client) {
    }
    handleJoinStore(client, storeId) {
        client.join(`store_${storeId}`);
        return { event: 'joined', storeId };
    }
    handleJoinDriver(client, driverId) {
        client.join(`driver_${driverId}`);
        client.join('drivers_pool');
        return { event: 'joined', driverId };
    }
    emitNewOrder(orderData) {
        if (!this.server)
            return;
        this.server.to(`store_${orderData.storeId}`).emit('newOrder', orderData);
        this.server.emit('adminOrderAlert', orderData);
    }
    emitOrderStatusUpdate(update) {
        if (!this.server)
            return;
        this.server.emit('orderUpdated', update);
        if (update.storeId) {
            this.server.to(`store_${update.storeId}`).emit('orderUpdated', update);
        }
    }
    emitJobAvailable(job) {
        if (!this.server)
            return;
        this.server.to('drivers_pool').emit('jobAvailable', job);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinStore'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinStore", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinDriver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinDriver", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map
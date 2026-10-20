import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('joinStore')
  handleJoinStore(client: Socket, storeId: number) {
    client.join(`store_${storeId}`);
    return { event: 'joined', storeId };
  }

  @SubscribeMessage('joinDriver')
  handleJoinDriver(client: Socket, driverId: number) {
    client.join(`driver_${driverId}`);
    client.join('drivers_pool');
    return { event: 'joined', driverId };
  }

  emitNewOrder(orderData: any) {
    if (!this.server) return;
    // Broadcast to store specific room
    this.server.to(`store_${orderData.storeId}`).emit('newOrder', orderData);
    // Broadcast to admin room
    this.server.emit('adminOrderAlert', orderData);
  }

  emitOrderStatusUpdate(update: { orderId: number; status: string; storeId?: number; driverId?: number }) {
    if (!this.server) return;
    this.server.emit('orderUpdated', update);
    if (update.storeId) {
      this.server.to(`store_${update.storeId}`).emit('orderUpdated', update);
    }
  }

  emitJobAvailable(job: any) {
    if (!this.server) return;
    this.server.to('drivers_pool').emit('jobAvailable', job);
  }
}

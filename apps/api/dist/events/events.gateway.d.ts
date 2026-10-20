import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinStore(client: Socket, storeId: number): {
        event: string;
        storeId: number;
    };
    handleJoinDriver(client: Socket, driverId: number): {
        event: string;
        driverId: number;
    };
    emitNewOrder(orderData: any): void;
    emitOrderStatusUpdate(update: {
        orderId: number;
        status: string;
        storeId?: number;
        driverId?: number;
    }): void;
    emitJobAvailable(job: any): void;
}

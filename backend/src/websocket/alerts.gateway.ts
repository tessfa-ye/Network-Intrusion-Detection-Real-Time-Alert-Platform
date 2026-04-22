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
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients = new Map<string, Socket>();

    handleConnection(client: Socket) {
        console.log(`✓ Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);
    }

    handleDisconnect(client: Socket) {
        console.log(`✗ Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('authenticate')
    handleAuthenticate(client: Socket, token: string) {
        // TODO: Validate JWT token
        console.log(`🔐 Client ${client.id} authenticated`);
        return { event: 'authenticated', data: { success: true } };
    }

    @SubscribeMessage('subscribe:alerts')
    handleSubscribeAlerts(client: Socket) {
        client.join('alerts');
        console.log(`📢 Client ${client.id} subscribed to alerts`);
        return { event: 'subscribed', data: { channel: 'alerts' } };
    }

    // Public methods to broadcast alerts
    broadcastNewAlert(alert: any) {
        this.server.to('alerts').emit('alert:new', alert);
        console.log(`📨 Broadcasted new alert: ${alert._id}`);
    }

    broadcastAlertUpdate(alert: any) {
        this.server.to('alerts').emit('alert:updated', alert);
        console.log(`🔄 Broadcasted alert update: ${alert._id}`);
    }

    broadcastSystemHealth(health: any) {
        this.server.emit('system:health', health);
    }

    broadcastNewEvent(event: any) {
        this.server.to('events').emit('event:new', event);
    }

    @SubscribeMessage('subscribe:events')
    handleSubscribeEvents(client: Socket) {
        client.join('events');
        console.log(`📡 Client ${client.id} subscribed to live events`);
        return { event: 'subscribed', data: { channel: 'events' } };
    }

    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }
}

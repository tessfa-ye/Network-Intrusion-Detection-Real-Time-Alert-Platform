import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private jwtService: JwtService) {}

    private connectedClients = new Map<string, Socket>();

    handleConnection(client: Socket) {
        const token = client.handshake?.auth?.token;
        if (token) {
            try {
                const payload = this.jwtService.verify(token);
                if (payload && payload.tenantId) {
                    client.data.tenantId = payload.tenantId;
                    console.log(`✓ Client connected & authenticated: ${client.id} (tenant: ${payload.tenantId})`);
                    this.connectedClients.set(client.id, client);
                    return;
                }
            } catch (e) {
                console.log(`✗ Client ${client.id} connected with invalid token`);
            }
        }
        console.log(`✓ Client connected (unauthenticated): ${client.id}`);
        this.connectedClients.set(client.id, client);
    }

    handleDisconnect(client: Socket) {
        console.log(`✗ Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('authenticate')
    handleAuthenticate(client: Socket, token: string) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload && payload.tenantId) {
                client.data.tenantId = payload.tenantId;
                console.log(`🔐 Client ${client.id} authenticated for tenant ${payload.tenantId}`);
                return { event: 'authenticated', data: { success: true } };
            }
        } catch (e) {
            console.log(`❌ Client ${client.id} authentication failed`);
        }
        return { event: 'authenticated', data: { success: false } };
    }

    @SubscribeMessage('subscribe:alerts')
    handleSubscribeAlerts(client: Socket) {
        const tenantId = client.data.tenantId;
        if (tenantId) {
            client.join(`alerts_${tenantId}`);
            console.log(`📢 Client ${client.id} subscribed to alerts for tenant ${tenantId}`);
        }
        return { event: 'subscribed', data: { channel: 'alerts' } };
    }

    // Public methods to broadcast alerts
    broadcastNewAlert(alert: any) {
        if (alert.tenantId) {
            this.server.to(`alerts_${alert.tenantId}`).emit('alert:new', alert);
            console.log(`📨 Broadcasted new alert: ${alert._id}`);
        }
    }

    broadcastAlertUpdate(alert: any) {
        if (alert.tenantId) {
            this.server.to(`alerts_${alert.tenantId}`).emit('alert:updated', alert);
            console.log(`🔄 Broadcasted alert update: ${alert._id}`);
        }
    }

    broadcastSystemHealth(health: any) {
        // System health might be global or tenant specific. For now, emit globally or update later.
        this.server.emit('system:health', health);
    }

    broadcastNewEvent(event: any) {
        if (event.tenantId) {
            console.log(`📨 Broadcasting event ${event.eventType} to room events_${event.tenantId}`);
            this.server.to(`events_${event.tenantId}`).emit('event:new', event);
        } else {
            console.log(`⚠️ Attempted to broadcast event without tenantId:`, event);
        }
    }

    @SubscribeMessage('subscribe:events')
    handleSubscribeEvents(client: Socket) {
        const tenantId = client.data.tenantId;
        if (tenantId) {
            client.join(`events_${tenantId}`);
            console.log(`📡 Client ${client.id} subscribed to live events for tenant ${tenantId}`);
        }
        return { event: 'subscribed', data: { channel: 'events' } };
    }

    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }
}

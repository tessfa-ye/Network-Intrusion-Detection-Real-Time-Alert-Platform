import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SecurityEvent } from '@prisma/client';
import { AlertsGateway } from '../websocket/alerts.gateway';
import { FirewallService } from '../firewall/firewall.service';
import * as geoip from 'geoip-lite';

@Injectable()
export class EventsService {
    constructor(
        private prisma: PrismaService,
        private alertsGateway: AlertsGateway,
        private firewallService: FirewallService,
    ) { }

    async create(tenantId: string, eventData: any): Promise<SecurityEvent> {
        if (this.firewallService.isIpBlocked(tenantId, eventData.sourceIP)) {
            console.log(`🛑 DROP: Blocked IP ${eventData.sourceIP} tried to send event.`);
            return { ...eventData, status: 'Blocked' } as any; 
        }

        const geo = geoip.lookup(eventData.sourceIP);
        let location = eventData.location;

        if (!location && geo) {
            location = {
                country: geo.country,
                city: geo.city,
                lat: geo.ll[0],
                lon: geo.ll[1],
            };
        }

        const savedEvent = await this.prisma.securityEvent.create({
            data: {
                ...eventData,
                tenantId,
                location: location || undefined,
                status: 'Pending',
            },
        });
        
        if (this.alertsGateway) {
            this.alertsGateway.broadcastNewEvent(savedEvent);
        }

        return savedEvent;
    }

    async createMany(tenantId: string, eventsData: any[]): Promise<any> {
        const dataWithTenant = eventsData.map(e => ({ ...e, tenantId }));
        return this.prisma.securityEvent.createMany({
            data: dataWithTenant,
        });
    }

    async findAll(tenantId: string, filters: any = {}, limit: number = 100): Promise<SecurityEvent[]> {
        return this.prisma.securityEvent.findMany({
            where: { ...filters, tenantId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    async findById(tenantId: string, id: string): Promise<SecurityEvent | null> {
        return this.prisma.securityEvent.findFirst({
            where: { id, tenantId },
        });
    }

    async getStats(tenantId: string): Promise<any> {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [total, last24hCount, bySeverity, byType] = await Promise.all([
            this.prisma.securityEvent.count({ where: { tenantId } }),
            this.prisma.securityEvent.count({ where: { tenantId, timestamp: { gte: last24h } } }),
            this.prisma.securityEvent.groupBy({
                by: ['severity'],
                where: { tenantId },
                _count: { severity: true },
            }),
            this.prisma.securityEvent.groupBy({
                by: ['eventType'],
                where: { tenantId },
                _count: { eventType: true },
            }),
        ]);

        return {
            total,
            last24h: last24hCount,
            bySeverity: bySeverity.map(s => ({ _id: s.severity, count: s._count.severity })),
            byType: byType.map(t => ({ _id: t.eventType, count: t._count.eventType })),
        };
    }

    async findUnprocessed(tenantId?: string, limit: number = 100): Promise<SecurityEvent[]> {
        return this.prisma.securityEvent.findMany({
            where: tenantId ? { status: 'Pending', tenantId } : { status: 'Pending' },
            orderBy: { timestamp: 'asc' },
            take: limit,
        });
    }

    async markAsProcessed(ids: string[], status: string = 'Processed', tenantId?: string): Promise<void> {
        await this.prisma.securityEvent.updateMany({
            where: tenantId ? { id: { in: ids }, tenantId } : { id: { in: ids } },
            data: { status },
        });
    }
}

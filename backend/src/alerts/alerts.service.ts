import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Alert } from '@prisma/client';
import { AlertsGateway } from '../websocket/alerts.gateway';

@Injectable()
export class AlertsService {
    constructor(
        private prisma: PrismaService,
        private alertsGateway: AlertsGateway,
    ) { }

    async create(tenantId: string, alertData: any): Promise<Alert> {
        const { eventIds, ...data } = alertData;
        const savedAlert = await this.prisma.alert.create({
            data: {
                ...data,
                tenantId,
                events: {
                    connect: eventIds?.map((id: string) => ({ id })) || [],
                },
            },
            include: {
                assignee: { select: { firstName: true, lastName: true, email: true } },
            },
        });

        if (this.alertsGateway) {
            this.alertsGateway.broadcastNewAlert(savedAlert);
        }
        console.log('🔔 New alert created and broadcasted:', savedAlert.id);

        return savedAlert;
    }

    async findAll(tenantId: string, filters: any = {}, limit: number = 100): Promise<Alert[]> {
        return this.prisma.alert.findMany({
            where: { ...filters, tenantId },
            include: {
                events: true,
                assignee: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findById(tenantId: string, id: string): Promise<Alert | null> {
        return this.prisma.alert.findUnique({
            where: { id }, // tenantId could be part of a composite key, or just check implicitly. Let's add it to findFirst for safety.
        });
    }

    async findByIdSafe(tenantId: string, id: string): Promise<Alert | null> {
        return this.prisma.alert.findFirst({
            where: { id, tenantId },
            include: {
                events: true,
                investigationNotes: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });
    }

    async updateStatus(
        tenantId: string,
        id: string,
        status: string,
        userId?: string,
    ): Promise<Alert | null> {
        const data: any = { status };
        if (userId) {
            data.assignedTo = userId;
        }
        // Using updateMany to enforce tenant isolation
        const result = await this.prisma.alert.updateMany({
            where: { id, tenantId },
            data,
        });
        if (result.count === 0) return null;
        return this.findByIdSafe(tenantId, id);
    }

    async assignAlert(tenantId: string, id: string, userId: string | null): Promise<Alert | null> {
        const result = await this.prisma.alert.updateMany({
            where: { id, tenantId },
            data: { assignedTo: userId },
        });
        if (result.count === 0) return null;
        
        const alert = await this.prisma.alert.findFirst({
            where: { id, tenantId },
            include: {
                assignee: { select: { firstName: true, lastName: true, email: true } },
            },
        });

        if (alert && this.alertsGateway) {
            this.alertsGateway.broadcastAlertUpdate(alert);
        }

        return alert;
    }

    async addNote(
        tenantId: string,
        id: string,
        userId: string,
        note: string,
    ): Promise<any> {
        return this.prisma.investigationNote.create({
            data: {
                tenantId,
                alertId: id,
                userId,
                note,
            },
        });
    }

    async bulkUpdateStatus(
        tenantId: string,
        alertIds: string[],
        status: string,
    ): Promise<{ updated: number }> {
        try {
            console.log(`🔄 Bulk updating ${alertIds.length} alerts to ${status}`);
            const result = await this.prisma.alert.updateMany({
                where: { id: { in: alertIds }, tenantId },
                data: { status },
            });

            if (result.count > 0) {
                const updatedAlerts = await this.prisma.alert.findMany({
                    where: { id: { in: alertIds }, tenantId },
                });
                updatedAlerts.forEach(alert => {
                    if (this.alertsGateway) {
                        this.alertsGateway.broadcastAlertUpdate(alert);
                    }
                });
            }

            return { updated: result.count };
        } catch (error) {
            console.error('❌ Bulk update failed:', error);
            throw error;
        }
    }

    async bulkDelete(tenantId: string, alertIds: string[]): Promise<{ deleted: number }> {
        try {
            console.log(`🗑️ Bulk deleting ${alertIds.length} alerts for tenant ${tenantId}`);
            const result = await this.prisma.alert.deleteMany({
                where: { id: { in: alertIds }, tenantId },
            });

            console.log(`🗑️ Bulk deleted ${result.count} alerts`);
            return { deleted: result.count };
        } catch (error) {
            console.error('❌ Bulk delete failed:', error);
            throw error;
        }
    }

    async getStats(tenantId: string): Promise<any> {
        const [total, byStatus, bySeverity, pending] = await Promise.all([
            this.prisma.alert.count({ where: { tenantId } }),
            this.prisma.alert.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
            }),
            this.prisma.alert.groupBy({
                by: ['severity'],
                where: { tenantId },
                _count: { severity: true },
            }),
            this.prisma.alert.count({ where: { status: 'pending', tenantId } }),
        ]);

        return {
            total,
            byStatus: byStatus.map(s => ({ _id: s.status, count: s._count.status })),
            bySeverity: bySeverity.map(s => ({ _id: s.severity, count: s._count.severity })),
            pending,
        };
    }

    async exportCsv(tenantId: string, filters: any = {}): Promise<string> {
        const alerts = await this.prisma.alert.findMany({
            where: { ...filters, tenantId },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const headers = ['ID', 'Rule Name', 'Severity', 'Status', 'Summary', 'Assigned To', 'Created At'];
        const rows = alerts.map(a => [
            a.id,
            a.ruleName,
            a.severity,
            a.status,
            `"${a.summary.replace(/"/g, '""')}"`,
            a.assignee ? `${a.assignee.firstName} ${a.assignee.lastName}` : 'Unassigned',
            a.createdAt.toISOString(),
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}

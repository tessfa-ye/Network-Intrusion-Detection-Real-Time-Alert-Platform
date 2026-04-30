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

    async create(alertData: any): Promise<Alert> {
        const { eventIds, ...data } = alertData;
        const savedAlert = await this.prisma.alert.create({
            data: {
                ...data,
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

    async findAll(filters: any = {}, limit: number = 100): Promise<Alert[]> {
        return this.prisma.alert.findMany({
            where: filters,
            include: {
                events: true,
                assignee: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findById(id: string): Promise<Alert | null> {
        return this.prisma.alert.findUnique({
            where: { id },
            include: {
                events: true,
                investigationNotes: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });
    }

    async updateStatus(
        id: string,
        status: string,
        userId?: string,
    ): Promise<Alert | null> {
        const data: any = { status };
        if (userId) {
            data.assignedTo = userId;
        }
        return this.prisma.alert.update({
            where: { id },
            data,
        });
    }

    async assignAlert(id: string, userId: string | null): Promise<Alert | null> {
        const alert = await this.prisma.alert.update({
            where: { id },
            data: { assignedTo: userId },
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
        id: string,
        userId: string,
        note: string,
    ): Promise<any> {
        return this.prisma.investigationNote.create({
            data: {
                alertId: id,
                userId,
                note,
            },
        });
    }

    async bulkUpdateStatus(
        alertIds: string[],
        status: string,
    ): Promise<{ updated: number }> {
        try {
            console.log(`🔄 Bulk updating ${alertIds.length} alerts to ${status}`);
            const result = await this.prisma.alert.updateMany({
                where: { id: { in: alertIds } },
                data: { status },
            });

            if (result.count > 0) {
                const updatedAlerts = await this.prisma.alert.findMany({
                    where: { id: { in: alertIds } },
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

    async bulkDelete(alertIds: string[]): Promise<{ deleted: number }> {
        try {
            console.log(`🗑️ Bulk deleting ${alertIds.length} alerts`);
            const result = await this.prisma.alert.deleteMany({
                where: { id: { in: alertIds } },
            });

            console.log(`🗑️ Bulk deleted ${result.count} alerts`);
            return { deleted: result.count };
        } catch (error) {
            console.error('❌ Bulk delete failed:', error);
            throw error;
        }
    }

    async getStats(): Promise<any> {
        const [total, byStatus, bySeverity, pending] = await Promise.all([
            this.prisma.alert.count(),
            this.prisma.alert.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            this.prisma.alert.groupBy({
                by: ['severity'],
                _count: { severity: true },
            }),
            this.prisma.alert.count({ where: { status: 'pending' } }),
        ]);

        return {
            total,
            byStatus: byStatus.map(s => ({ _id: s.status, count: s._count.status })),
            bySeverity: bySeverity.map(s => ({ _id: s.severity, count: s._count.severity })),
            pending,
        };
    }

    async exportCsv(filters: any = {}): Promise<string> {
        const alerts = await this.prisma.alert.findMany({
            where: filters,
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

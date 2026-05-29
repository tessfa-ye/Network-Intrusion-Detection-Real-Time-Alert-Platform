import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) {}

    /**
     * Log an administrative action for audit trail
     */
    async log(params: {
        tenantId: string;
        userId: string;
        action: string;
        resource: string;
        resourceId?: string;
        details?: any;
        ipAddress?: string;
    }): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantId: params.tenantId,
                    userId: params.userId,
                    action: params.action,
                    resource: params.resource,
                    resourceId: params.resourceId,
                    details: params.details || {},
                    ipAddress: params.ipAddress,
                },
            });
        } catch (error) {
            // Audit logging should never break the main flow
            console.error('⚠️ Audit log failed:', error.message);
        }
    }

    /**
     * Query audit logs for a tenant
     */
    async findAll(
        tenantId: string,
        filters: {
            userId?: string;
            action?: string;
            resource?: string;
            startDate?: Date;
            endDate?: Date;
        } = {},
        limit = 100,
    ) {
        const where: any = { tenantId };
        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
        if (filters.resource) where.resource = filters.resource;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        return this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findAll(
        @TenantId() tenantId: string,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('resource') resource?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: number,
    ) {
        return this.auditService.findAll(
            tenantId,
            {
                userId,
                action,
                resource,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            },
            limit || 100,
        );
    }
}

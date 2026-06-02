import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException, InternalServerErrorException, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { AlertsService } from './alerts.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    async findAll(
        @TenantId() tenantId: string,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('severity') severity?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (severity) filters.severity = severity;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        return this.alertsService.findAll(tenantId, filters, limit || 100);
    }

    @Get('stats')
    async getStats(@TenantId() tenantId: string) {
        return this.alertsService.getStats(tenantId);
    }

    @Get('export')
    async export(
        @TenantId() tenantId: string,
        @Query('status') status?: string,
        @Query('severity') severity?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (severity) filters.severity = severity;
        
        return this.alertsService.exportCsv(tenantId, filters);
    }

    @Get(':id')
    async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.alertsService.findByIdSafe(tenantId, id);
    }

    @Patch('bulk-update')
    @Roles('ADMIN', 'ANALYST')
    async bulkUpdate(
        @TenantId() tenantId: string,
        @Body('alertIds') alertIds: string[],
        @Body('status') status?: string,
        @Body('action') action?: 'delete',
    ) {
        console.log('📝 Bulk update request:', { count: alertIds?.length, status, action });

        if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
            throw new BadRequestException('No alert IDs provided');
        }

        if (action === 'delete') {
            return this.alertsService.bulkDelete(tenantId, alertIds);
        }

        if (!status) {
            throw new BadRequestException('Status is required for update');
        }

        try {
            return await this.alertsService.bulkUpdateStatus(tenantId, alertIds, status);
        } catch (error) {
            console.error('❌ Bulk update error in controller:', error);
            throw new InternalServerErrorException(`Bulk update failed: ${error.message}`);
        }
    }

    @Patch(':id/assign')
    @Roles('ADMIN', 'ANALYST')
    async assignAlert(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Body('userId') userId: string,
    ) {
        // Allow empty string or null for unassignment
        return this.alertsService.assignAlert(tenantId, id, userId);
    }

    @Patch(':id')
    @Roles('ADMIN', 'ANALYST')
    async updateStatus(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Body('status') status: string,
        @Body('userId') userId?: string,
    ) {
        return this.alertsService.updateStatus(tenantId, id, status, userId);
    }

    @Post(':id/notes')
    @Roles('ADMIN', 'ANALYST')
    async addNote(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Req() req: any,
        @Body('note') note: string,
    ) {
        const userId = req.user.userId;
        return this.alertsService.addNote(tenantId, id, userId, note);
    }

    // Test endpoint for WebSocket real-time testing
    @Post('test')
    async createTestAlert(@TenantId() tenantId: string, @Body() body?: { severity?: string; summary?: string }) {
        const testAlert = {
            eventIds: [],
            ruleId: 'test_realtime_websocket',
            ruleName: '🔴 Real-Time WebSocket Test',
            severity: body?.severity || 'critical',
            status: 'pending',
            summary: body?.summary || '🧪 This alert was created via API and should appear instantly via WebSocket!',
            affectedAssets: ['test-server-realtime'],
        };

        return this.alertsService.create(tenantId, testAlert as any);
    }
}

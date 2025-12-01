import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    async findAll(
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

        return this.alertsService.findAll(filters, limit || 100);
    }

    @Get('stats')
    async getStats() {
        return this.alertsService.getStats();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.alertsService.findById(id);
    }

    @Patch('bulk-update')
    async bulkUpdate(
        @Body('alertIds') alertIds: string[],
        @Body('status') status?: string,
        @Body('action') action?: 'delete',
    ) {
        console.log('📝 Bulk update request:', { count: alertIds?.length, status, action });

        if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
            throw new BadRequestException('No alert IDs provided');
        }

        if (action === 'delete') {
            return this.alertsService.bulkDelete(alertIds);
        }

        if (!status) {
            throw new BadRequestException('Status is required for update');
        }

        try {
            return await this.alertsService.bulkUpdateStatus(alertIds, status);
        } catch (error) {
            console.error('❌ Bulk update error in controller:', error);
            throw new InternalServerErrorException(`Bulk update failed: ${error.message}`);
        }
    }

    @Patch(':id/assign')
    async assignAlert(
        @Param('id') id: string,
        @Body('userId') userId: string,
    ) {
        // Allow empty string or null for unassignment
        return this.alertsService.assignAlert(id, userId);
    }

    @Patch(':id')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: string,
        @Body('userId') userId?: string,
    ) {
        return this.alertsService.updateStatus(id, status, userId);
    }

    @Post(':id/notes')
    async addNote(
        @Param('id') id: string,
        @Body('userId') userId: string,
        @Body('note') note: string,
    ) {
        return this.alertsService.addNote(id, userId, note);
    }

    // Test endpoint for WebSocket real-time testing
    @Post('test')
    async createTestAlert(@Body() body?: { severity?: string; summary?: string }) {
        const testAlert = {
            eventIds: [],
            ruleId: 'test_realtime_websocket',
            ruleName: '🔴 Real-Time WebSocket Test',
            severity: body?.severity || 'critical',
            status: 'pending',
            summary: body?.summary || '🧪 This alert was created via API and should appear instantly via WebSocket!',
            affectedAssets: ['test-server-realtime'],
            investigationNotes: [],
        };

        return this.alertsService.create(testAlert as any);
    }
}

import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    async findAll(
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('severity') severity?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (severity) filters.severity = severity;

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

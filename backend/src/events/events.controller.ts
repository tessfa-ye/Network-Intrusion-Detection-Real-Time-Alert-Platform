import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@TenantId() tenantId: string, @Body() eventData: any) {
        return this.eventsService.create(tenantId, eventData);
    }

    @Post('batch')
    @UseGuards(JwtAuthGuard)
    async createBatch(@TenantId() tenantId: string, @Body() body: { events: any[] }) {
        if (!body.events || !Array.isArray(body.events)) {
            return { error: 'Invalid batch format. Expected { events: [...] }' };
        }
        return this.eventsService.createMany(tenantId, body.events);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(
        @TenantId() tenantId: string,
        @Query('limit') limit?: number,
        @Query('eventType') eventType?: string,
        @Query('severity') severity?: string,
        @Query('sourceIP') sourceIP?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const filters: any = {};
        if (eventType) filters.eventType = eventType;
        if (severity) filters.severity = severity;
        if (sourceIP) filters.sourceIP = sourceIP;
        if (startDate) filters.timestamp = { gte: new Date(startDate as string) };
        if (endDate) filters.timestamp = { ...filters.timestamp, lte: new Date(endDate as string) };

        return this.eventsService.findAll(tenantId, filters, limit || 100);
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard)
    async getStats(@TenantId() tenantId: string) {
        return this.eventsService.getStats(tenantId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.eventsService.findById(tenantId, id);
    }
}

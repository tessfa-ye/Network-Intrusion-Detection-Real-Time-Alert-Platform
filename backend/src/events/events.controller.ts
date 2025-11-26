import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    async create(@Body() eventData: any) {
        if (Array.isArray(eventData)) {
            // Ensure timestamp is a Date object
            const eventsWithDates = eventData.map(e => ({
                ...e,
                timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
            }));
            return this.eventsService.createMany(eventsWithDates);
        }
        // Ensure timestamp is a Date object
        const eventWithDate = {
            ...eventData,
            timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
        };
        return this.eventsService.create(eventWithDate);
    }

    @Get()
    async findAll(
        @Query('limit') limit?: number,
        @Query('eventType') eventType?: string,
        @Query('severity') severity?: string,
        @Query('sourceIP') sourceIP?: string,
    ) {
        const filters: any = {};
        if (eventType) filters.eventType = eventType;
        if (severity) filters.severity = severity;
        if (sourceIP) filters.sourceIP = sourceIP;

        return this.eventsService.findAll(filters, limit || 100);
    }

    @Get('stats')
    async getStats() {
        return this.eventsService.getStats();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.eventsService.findById(id);
    }
}

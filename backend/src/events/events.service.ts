import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SecurityEvent, SecurityEventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(SecurityEvent.name)
        private eventModel: Model<SecurityEventDocument>,
    ) { }

    async create(eventData: any): Promise<SecurityEvent> {
        const event = new this.eventModel({
            ...eventData,
            processed: false,
        });
        return event.save();
    }

    async createMany(eventsData: any[]): Promise<any[]> {
        return this.eventModel.insertMany(eventsData);
    }

    async findAll(filters: any = {}, limit: number = 100): Promise<SecurityEvent[]> {
        return this.eventModel
            .find(filters)
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
    }

    async findById(id: string): Promise<SecurityEvent | null> {
        return this.eventModel.findById(id).exec();
    }

    async getStats(): Promise<any> {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [total, last24hCount, bySeverity, byType] = await Promise.all([
            this.eventModel.countDocuments(),
            this.eventModel.countDocuments({ timestamp: { $gte: last24h } }),
            this.eventModel.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } },
            ]),
            this.eventModel.aggregate([
                { $group: { _id: '$eventType', count: { $sum: 1 } } },
            ]),
        ]);

        return {
            total,
            last24h: last24hCount,
            bySeverity,
            byType,
        };
    }

    async findUnprocessed(limit: number = 100): Promise<any[]> {
        return this.eventModel
            .find({ processed: false })
            .sort({ timestamp: 1 })
            .limit(limit)
            .lean()
            .exec();
    }

    async markAsProcessed(ids: string[]): Promise<void> {
        await this.eventModel.updateMany(
            { _id: { $in: ids } },
            { $set: { processed: true } },
        );
    }
}

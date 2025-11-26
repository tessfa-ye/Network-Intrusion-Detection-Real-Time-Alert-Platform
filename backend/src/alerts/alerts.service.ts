import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { AlertsGateway } from '../websocket/alerts.gateway';

@Injectable()
export class AlertsService {
    constructor(
        @InjectModel(Alert.name)
        private alertModel: Model<AlertDocument>,
        @Inject(forwardRef(() => AlertsGateway))
        private alertsGateway: AlertsGateway,
    ) { }

    async create(alertData: Partial<Alert>): Promise<Alert> {
        const alert = new this.alertModel(alertData);
        const savedAlert = await alert.save();

        // Emit WebSocket event for real-time updates
        this.alertsGateway.broadcastNewAlert(savedAlert.toObject());
        console.log('🔔 New alert created and broadcasted:', savedAlert._id);

        return savedAlert;
    }

    async findAll(filters: any = {}, limit: number = 100): Promise<Alert[]> {
        return this.alertModel
            .find(filters)
            .populate('eventIds')
            .populate('assignedTo', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    async findById(id: string): Promise<Alert | null> {
        return this.alertModel
            .findById(id)
            .populate('eventIds')
            .populate('investigationNotes.userId', 'firstName lastName')
            .exec();
    }

    async updateStatus(
        id: string,
        status: string,
        userId?: string,
    ): Promise<Alert | null> {
        const update: any = { status };
        if (userId) {
            update.assignedTo = new Types.ObjectId(userId);
        }
        return this.alertModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }

    async addNote(
        id: string,
        userId: string,
        note: string,
    ): Promise<Alert | null> {
        return this.alertModel
            .findByIdAndUpdate(
                id,
                {
                    $push: {
                        investigationNotes: {
                            userId: new Types.ObjectId(userId),
                            timestamp: new Date(),
                            note,
                        },
                    },
                },
                { new: true },
            )
            .exec();
    }

    async getStats(): Promise<any> {
        const [total, byStatus, bySeverity, pending] = await Promise.all([
            this.alertModel.countDocuments(),
            this.alertModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            this.alertModel.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } },
            ]),
            this.alertModel.countDocuments({ status: 'pending' }),
        ]);

        return {
            total,
            byStatus,
            bySeverity,
            pending,
        };
    }
}

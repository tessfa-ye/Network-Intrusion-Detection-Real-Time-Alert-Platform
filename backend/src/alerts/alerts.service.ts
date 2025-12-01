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
        private alertsGateway: AlertsGateway,
    ) { }

    async create(alertData: Partial<Alert>): Promise<Alert> {
        const alert = new this.alertModel(alertData);
        const savedAlert = await alert.save();

        // Emit WebSocket event for real-time updates
        if (this.alertsGateway) {
            this.alertsGateway.broadcastNewAlert(savedAlert.toObject());
        }
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

    async assignAlert(id: string, userId: string): Promise<Alert | null> {
        let update: any;
        if (userId && Types.ObjectId.isValid(userId)) {
            update = { assignedTo: new Types.ObjectId(userId) };
        } else {
            update = { $unset: { assignedTo: 1 } };
        }

        const alert = await this.alertModel.findByIdAndUpdate(
            id,
            update,
            { new: true },
        ).populate('assignedTo', 'firstName lastName email');

        if (alert && this.alertsGateway) {
            this.alertsGateway.broadcastAlertUpdate(alert.toObject());
        }

        return alert;
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

    async bulkUpdateStatus(
        alertIds: string[],
        status: string,
    ): Promise<{ updated: number }> {
        try {
            console.log(`🔄 Bulk updating ${alertIds.length} alerts to ${status}`);
            const objectIds = alertIds.map(id => new Types.ObjectId(id));

            const result = await this.alertModel.updateMany(
                { _id: { $in: objectIds } },
                { status },
            );

            // Broadcast updates for real-time UI sync
            if (result.modifiedCount > 0) {
                try {
                    const updatedAlerts = await this.alertModel.find({ _id: { $in: objectIds } });
                    updatedAlerts.forEach(alert => {
                        if (this.alertsGateway) {
                            this.alertsGateway.broadcastAlertUpdate(alert.toObject());
                        }
                    });
                } catch (wsError) {
                    console.error('⚠️ Failed to broadcast bulk updates:', wsError);
                }
            }

            return { updated: result.modifiedCount };
        } catch (error) {
            console.error('❌ Bulk update failed:', error);
            throw error;
        }
    }

    async bulkDelete(alertIds: string[]): Promise<{ deleted: number }> {
        try {
            console.log(`🗑️ Bulk deleting ${alertIds.length} alerts`);
            const objectIds = alertIds.map(id => new Types.ObjectId(id));

            const result = await this.alertModel.deleteMany({
                _id: { $in: objectIds },
            });

            console.log(`🗑️ Bulk deleted ${result.deletedCount} alerts`);
            return { deleted: result.deletedCount };
        } catch (error) {
            console.error('❌ Bulk delete failed:', error);
            throw error;
        }
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

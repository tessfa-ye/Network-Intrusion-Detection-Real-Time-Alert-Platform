import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: true })
export class Alert {
    @Prop({ type: [Types.ObjectId], ref: 'SecurityEvent', required: true })
    eventIds: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'DetectionRule', required: true })
    ruleId: Types.ObjectId;

    @Prop({ required: true })
    ruleName: string;

    @Prop({
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
    })
    severity: string;

    @Prop({
        required: true,
        enum: ['pending', 'investigating', 'resolved', 'escalated', 'false_positive'],
        default: 'pending',
    })
    status: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignedTo?: Types.ObjectId;

    @Prop({
        type: [
            {
                userId: { type: Types.ObjectId, ref: 'User' },
                timestamp: Date,
                note: String,
            },
        ],
        default: [],
    })
    investigationNotes: {
        userId: Types.ObjectId;
        timestamp: Date;
        note: string;
    }[];

    @Prop({ required: true })
    summary: string;

    @Prop({ type: [String], default: [] })
    affectedAssets: string[];
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Indexes
AlertSchema.index({ status: 1, severity: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ assignedTo: 1 });

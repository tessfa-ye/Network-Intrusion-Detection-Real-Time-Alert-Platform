import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SecurityEventDocument = SecurityEvent & Document;

@Schema({ timestamps: true })
export class SecurityEvent {
    @Prop({ required: true })
    timestamp: Date;

    @Prop({
        required: true,
        enum: ['login', 'api_access', 'firewall', 'file_access', 'network'],
    })
    eventType: string;

    @Prop({
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
    })
    severity: string;

    @Prop({ required: true, index: true })
    sourceIP: string;

    @Prop({ index: true })
    targetIP?: string;

    @Prop({ index: true })
    userId?: string;

    @Prop()
    deviceId?: string;

    @Prop({ type: Object })
    location?: {
        country: string;
        city: string;
        lat: number;
        lon: number;
    };

    @Prop({ required: true })
    description: string;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    @Prop({ default: false })
    processed: boolean;

    @Prop()
    anomalyScore?: number;
}

export const SecurityEventSchema = SchemaFactory.createForClass(SecurityEvent);

// Indexes for performance
SecurityEventSchema.index({ timestamp: -1 });
SecurityEventSchema.index({ eventType: 1, severity: 1 });
SecurityEventSchema.index({ sourceIP: 1, timestamp: -1 });

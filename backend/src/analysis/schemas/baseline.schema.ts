import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IPBaselineDocument = IPBaseline & Document;

@Schema({ timestamps: true })
export class IPBaseline {
    @Prop({ required: true, index: true })
    sourceIP: string;

    @Prop({ required: true })
    eventType: string;

    @Prop({ default: 0 })
    avgFrequency: number; // Events per minute

    @Prop({ default: 0 })
    stdDev: number;

    @Prop({ default: 0 })
    sampleCount: number;

    @Prop({ default: Date.now })
    lastCalculated: Date;
}

export const IPBaselineSchema = SchemaFactory.createForClass(IPBaseline);
IPBaselineSchema.index({ sourceIP: 1, eventType: 1 }, { unique: true });

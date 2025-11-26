import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DetectionRuleDocument = DetectionRule & Document;

interface RuleCondition {
    eventType: string;
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'contains' | 'regex';
    value: any;
    timeWindow?: number;
    threshold?: number;
}

interface RuleAction {
    type: 'alert' | 'block' | 'email' | 'webhook';
    config: Record<string, any>;
}

@Schema({ timestamps: true })
export class DetectionRule {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: true })
    enabled: boolean;

    @Prop({
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
    })
    severity: string;

    @Prop({
        type: [Object],
        required: true,
    })
    conditions: RuleCondition[];

    @Prop({
        type: [Object],
        default: [{ type: 'alert', config: {} }],
    })
    actions: RuleAction[];

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const DetectionRuleSchema = SchemaFactory.createForClass(DetectionRule);

// Indexes
DetectionRuleSchema.index({ enabled: 1 });
DetectionRuleSchema.index({ severity: 1 });

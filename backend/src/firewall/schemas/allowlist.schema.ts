import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AllowlistDocument = Allowlist & Document;

@Schema({ timestamps: true })
export class Allowlist {
    @Prop({ required: true, unique: true })
    ip: string;

    @Prop({ required: true })
    reason: string;

    @Prop()
    originalReason?: string;

    @Prop()
    originalSeverity?: string;
}

export const AllowlistSchema = SchemaFactory.createForClass(Allowlist);

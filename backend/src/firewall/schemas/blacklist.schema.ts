import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlacklistDocument = Blacklist & Document;

@Schema({ timestamps: true })
export class Blacklist {
    @Prop({ required: true, unique: true })
    ip: string;

    @Prop({ required: true })
    reason: string;

    @Prop()
    severity: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    expiresAt: Date;
}

export const BlacklistSchema = SchemaFactory.createForClass(Blacklist);

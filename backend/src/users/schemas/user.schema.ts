import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop()
    passwordHash?: string;

    @Prop({
        required: true,
        enum: ['admin', 'security_officer', 'viewer'],
        default: 'security_officer',
    })
    role: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    phone?: string;

    @Prop({ type: String, enum: ['local', 'google', 'microsoft'], default: 'local' })
    authProvider: string;

    @Prop()
    providerId?: string;

    @Prop({
        type: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
            minSeverity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        },
        default: {
            email: true,
            sms: false,
            push: true,
            minSeverity: 'medium',
        },
    })
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
        minSeverity: 'low' | 'medium' | 'high' | 'critical';
    };

    @Prop({ default: true })
    active: boolean;

    @Prop()
    lastLogin?: Date;

    @Prop()
    refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, active: 1 });

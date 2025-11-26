import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        if (userData.passwordHash) {
            userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
        }

        const user = new this.userModel(userData);
        return user.save();
    }

    async findAll(): Promise<User[]> {
        return this.userModel
            .find()
            .select('-passwordHash -refreshToken')
            .exec();
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel
            .findById(id)
            .select('-passwordHash -refreshToken')
            .exec();
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }

    async findByProviderId(provider: string, providerId: string): Promise<User | null> {
        return this.userModel.findOne({ authProvider: provider, providerId }).exec();
    }

    async update(id: string, updateData: Partial<User>): Promise<User | null> {
        if (updateData.passwordHash) {
            updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10);
        }

        return this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .select('-passwordHash -refreshToken')
            .exec();
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { refreshToken });
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        if (!user.passwordHash) return false;
        return bcrypt.compare(password, user.passwordHash);
    }

    async delete(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id).exec();
    }
}

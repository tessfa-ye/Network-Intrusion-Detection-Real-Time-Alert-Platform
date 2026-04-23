import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blacklist, BlacklistDocument } from './schemas/blacklist.schema';

@Injectable()
export class FirewallService implements OnModuleInit {
    private cachedBlacklist: Set<string> = new Set();

    constructor(
        @InjectModel(Blacklist.name)
        private blacklistModel: Model<BlacklistDocument>,
    ) { }

    async onModuleInit() {
        try {
            await this.refreshCache();
        } catch (err) {
            console.error('⚠️ Failed to initialize Firewall cache:', err.message);
        }
    }

    async refreshCache() {
        const list = await this.blacklistModel.find({ isActive: true }).exec();
        this.cachedBlacklist = new Set(list.map(item => item.ip));
        console.log(`🛡️  Firewall Cache Updated: ${this.cachedBlacklist.size} IPs blocked.`);
    }

    async blockIp(ip: string, reason: string, severity: string = 'high'): Promise<Blacklist | null> {
        const existing = await this.blacklistModel.findOne({ ip });
        if (existing) {
            existing.isActive = true;
            existing.reason = reason;
            existing.severity = severity;
            await existing.save();
        } else {
            const newItem = new this.blacklistModel({ ip, reason, severity });
            await newItem.save();
        }
        this.cachedBlacklist.add(ip);
        return this.blacklistModel.findOne({ ip }).exec();
    }

    async unblockIp(ip: string): Promise<void> {
        await this.blacklistModel.updateOne({ ip }, { isActive: false });
        this.cachedBlacklist.delete(ip);
    }

    isIpBlocked(ip: string): boolean {
        return this.cachedBlacklist.has(ip);
    }

    async getBlacklist(): Promise<Blacklist[]> {
        return this.blacklistModel.find().sort({ createdAt: -1 }).exec();
    }
}

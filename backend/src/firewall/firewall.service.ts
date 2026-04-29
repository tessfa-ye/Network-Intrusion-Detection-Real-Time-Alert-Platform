import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blacklist, BlacklistDocument } from './schemas/blacklist.schema';
import { Allowlist, AllowlistDocument } from './schemas/allowlist.schema';

@Injectable()
export class FirewallService implements OnModuleInit {
    private cachedBlacklist: Set<string> = new Set();
    private cachedAllowlist: Set<string> = new Set();

    constructor(
        @InjectModel(Blacklist.name)
        private blacklistModel: Model<BlacklistDocument>,
        @InjectModel(Allowlist.name)
        private allowlistModel: Model<AllowlistDocument>,
    ) { }

    async onModuleInit() {
        try {
            await this.refreshCache();
        } catch (err) {
            console.error('⚠️ Failed to initialize Firewall cache:', err.message);
        }
    }

    async refreshCache() {
        const [blocks, allows] = await Promise.all([
            this.blacklistModel.find({ isActive: true }).exec(),
            this.allowlistModel.find().exec()
        ]);
        
        this.cachedBlacklist = new Set(blocks.map(item => item.ip));
        this.cachedAllowlist = new Set(allows.map(item => item.ip));
        
        console.log(`🛡️  Firewall Cache Updated: ${this.cachedBlacklist.size} blocked, ${this.cachedAllowlist.size} allowed.`);
    }

    async blockIp(ip: string, reason: string, severity: string = 'high'): Promise<Blacklist | null> {
        // If IP is in allowlist, we only skip if it's an automated intelligence block.
        // If it's a REAL sensor-detected attack, we block it regardless for safety.
        const isIntelligence = reason.includes('Global Threat Intelligence');
        if (this.cachedAllowlist.has(ip) && isIntelligence) {
            console.log(`⚪ IP ${ip} is in allowlist. Skipping automated intelligence block.`);
            return null;
        }

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
        // Find original data before deleting
        const original = await this.blacklistModel.findOne({ ip });
        const reason = original?.reason || '';
        
        // Remove from blacklist
        await this.blacklistModel.deleteOne({ ip });
        this.cachedBlacklist.delete(ip);

        // Logic:
        // 1. If it's a GLOBAL threat, we MUST move it to Allowlist to prevent daily re-sync.
        // 2. If it's a SENSOR/ALERT block, we move it to Allowlist to prevent immediate re-blocking.
        // 3. If it's a MANUAL block, we just delete it entirely.
        const isAutomated = reason.includes('Global Threat Intelligence') || 
                           reason.includes('Sensor') || 
                           reason.includes('Alert') || 
                           reason.includes('Detection');

        if (isAutomated && !this.cachedAllowlist.has(ip)) {
            await this.allowlistModel.create({ 
                ip, 
                reason: 'Manually unblocked by administrator',
                originalReason: original?.reason,
                originalSeverity: original?.severity
            });
            this.cachedAllowlist.add(ip);
        }
    }

    isIpBlocked(ip: string): boolean {
        return this.cachedBlacklist.has(ip);
    }

    getCacheSize(): number {
        return this.cachedBlacklist.size;
    }

    async getBlacklist(): Promise<Blacklist[]> {
        return this.blacklistModel.find().sort({ createdAt: -1 }).exec();
    }

    async getAllowlist(): Promise<Allowlist[]> {
        return this.allowlistModel.find().sort({ createdAt: -1 }).exec();
    }

    async removeFromAllowlist(ip: string): Promise<void> {
        const item = await this.allowlistModel.findOne({ ip });
        
        // Remove from allowlist
        await this.allowlistModel.deleteOne({ ip });
        this.cachedAllowlist.delete(ip);

        // If it was originally an intelligence block, re-block it immediately
        if (item?.originalReason) {
            console.log(`🛡️ Restoring original block for ${ip}: ${item.originalReason}`);
            await this.blockIp(ip, item.originalReason, item.originalSeverity || 'high');
        }
    }
}

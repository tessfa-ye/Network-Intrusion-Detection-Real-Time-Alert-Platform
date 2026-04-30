import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Blacklist, Allowlist } from '@prisma/client';

@Injectable()
export class FirewallService implements OnModuleInit {
    private cachedBlacklist: Set<string> = new Set();
    private cachedAllowlist: Set<string> = new Set();

    constructor(
        private prisma: PrismaService,
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
            this.prisma.blacklist.findMany({ where: { isActive: true } }),
            this.prisma.allowlist.findMany(),
        ]);
        
        this.cachedBlacklist = new Set(blocks.map(item => item.ip));
        this.cachedAllowlist = new Set(allows.map(item => item.ip));
        
        console.log(`🛡️  Firewall Cache Updated: ${this.cachedBlacklist.size} blocked, ${this.cachedAllowlist.size} allowed.`);
    }

    async blockIp(ip: string, reason: string, severity: string = 'high'): Promise<Blacklist | null> {
        const isIntelligence = reason.includes('Global Threat Intelligence');
        if (this.cachedAllowlist.has(ip) && isIntelligence) {
            console.log(`⚪ IP ${ip} is in allowlist. Skipping automated intelligence block.`);
            return null;
        }

        const existing = await this.prisma.blacklist.findUnique({ where: { ip } });
        let result: Blacklist;
        
        if (existing) {
            result = await this.prisma.blacklist.update({
                where: { ip },
                data: { isActive: true, reason, severity },
            });
        } else {
            result = await this.prisma.blacklist.create({
                data: { ip, reason, severity },
            });
        }
        
        this.cachedBlacklist.add(ip);
        return result;
    }

    async unblockIp(ip: string): Promise<void> {
        const original = await this.prisma.blacklist.findUnique({ where: { ip } });
        const reason = original?.reason || '';
        
        await this.prisma.blacklist.delete({ where: { ip } });
        this.cachedBlacklist.delete(ip);

        const isAutomated = reason.includes('Global Threat Intelligence') || 
                           reason.includes('Sensor') || 
                           reason.includes('Alert') || 
                           reason.includes('Detection');

        if (isAutomated && !this.cachedAllowlist.has(ip)) {
            await this.prisma.allowlist.create({ 
                data: {
                    ip, 
                    reason: 'Manually unblocked by administrator',
                    originalReason: original?.reason,
                    originalSeverity: original?.severity,
                },
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
        return this.prisma.blacklist.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async getAllowlist(): Promise<Allowlist[]> {
        return this.prisma.allowlist.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async removeFromAllowlist(ip: string): Promise<void> {
        const item = await this.prisma.allowlist.findUnique({ where: { ip } });
        
        await this.prisma.allowlist.delete({ where: { ip } });
        this.cachedAllowlist.delete(ip);

        if (item?.originalReason) {
            console.log(`🛡️ Restoring original block for ${ip}: ${item.originalReason}`);
            await this.blockIp(ip, item.originalReason, item.originalSeverity || 'high');
        }
    }
}

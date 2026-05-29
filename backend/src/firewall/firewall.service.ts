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

    async refreshCache(tenantId?: string) {
        // Simple global refresh for demo purposes, but in production, we should scope caching
        const [blocks, allows] = await Promise.all([
            this.prisma.blacklist.findMany({ where: tenantId ? { tenantId, isActive: true } : { isActive: true } }),
            this.prisma.allowlist.findMany(tenantId ? { where: { tenantId } } : undefined),
        ]);
        
        // Cache could be made tenant-aware by using composite keys (tenantId:ip)
        this.cachedBlacklist = new Set(blocks.map(item => `${item.tenantId}:${item.ip}`));
        this.cachedAllowlist = new Set(allows.map(item => `${item.tenantId}:${item.ip}`));
        
        console.log(`🛡️  Firewall Cache Updated: ${this.cachedBlacklist.size} blocked, ${this.cachedAllowlist.size} allowed.`);
    }

    async blockIp(tenantId: string, ip: string, reason: string, severity: string = 'high'): Promise<Blacklist | null> {
        const isIntelligence = reason.includes('Global Threat Intelligence');
        if (this.cachedAllowlist.has(`${tenantId}:${ip}`) && isIntelligence) {
            console.log(`⚪ IP ${ip} is in allowlist for tenant ${tenantId}. Skipping automated intelligence block.`);
            return null;
        }

        const existing = await this.prisma.blacklist.findUnique({ where: { tenantId_ip: { tenantId, ip } } });
        let result: Blacklist;
        
        if (existing) {
            result = await this.prisma.blacklist.update({
                where: { tenantId_ip: { tenantId, ip } },
                data: { isActive: true, reason, severity },
            });
        } else {
            result = await this.prisma.blacklist.create({
                data: { tenantId, ip, reason, severity },
            });
        }
        
        this.cachedBlacklist.add(`${tenantId}:${ip}`);
        return result;
    }

    async unblockIp(tenantId: string, ip: string): Promise<void> {
        const original = await this.prisma.blacklist.findUnique({ where: { tenantId_ip: { tenantId, ip } } });
        const reason = original?.reason || '';
        
        await this.prisma.blacklist.delete({ where: { tenantId_ip: { tenantId, ip } } });
        this.cachedBlacklist.delete(`${tenantId}:${ip}`);

        const isAutomated = reason.includes('Global Threat Intelligence') || 
                           reason.includes('Sensor') || 
                           reason.includes('Alert') || 
                           reason.includes('Detection');

        if (isAutomated && !this.cachedAllowlist.has(`${tenantId}:${ip}`)) {
            await this.prisma.allowlist.create({ 
                data: {
                    tenantId,
                    ip, 
                    reason: 'Manually unblocked by administrator',
                    originalReason: original?.reason,
                    originalSeverity: original?.severity,
                },
            });
            this.cachedAllowlist.add(`${tenantId}:${ip}`);
        }
    }

    isIpBlocked(tenantId: string, ip: string): boolean {
        return this.cachedBlacklist.has(`${tenantId}:${ip}`);
    }

    getCacheSize(): number {
        return this.cachedBlacklist.size;
    }

    async getBlacklist(tenantId: string): Promise<Blacklist[]> {
        return this.prisma.blacklist.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    }

    async getAllowlist(tenantId: string): Promise<Allowlist[]> {
        return this.prisma.allowlist.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    }

    async removeFromAllowlist(tenantId: string, ip: string): Promise<void> {
        const item = await this.prisma.allowlist.findUnique({ where: { tenantId_ip: { tenantId, ip } } });
        
        await this.prisma.allowlist.delete({ where: { tenantId_ip: { tenantId, ip } } });
        this.cachedAllowlist.delete(`${tenantId}:${ip}`);

        if (item?.originalReason) {
            console.log(`🛡️ Restoring original block for ${ip} in tenant ${tenantId}: ${item.originalReason}`);
            await this.blockIp(tenantId, ip, item.originalReason, item.originalSeverity || 'high');
        }
    }
}

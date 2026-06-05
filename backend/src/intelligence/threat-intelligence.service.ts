import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirewallService } from '../firewall/firewall.service';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class ThreatIntelligenceService {
    private readonly logger = new Logger(ThreatIntelligenceService.name);
    private readonly BLOCKLIST_URL = 'https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt';

    constructor(
        private readonly firewallService: FirewallService,
        private readonly prisma: PrismaService,
    ) {}

    // Run every day at midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async syncThreatFeeds(tenantId?: string) {
        this.logger.log(`🌐 Synchronizing global threat intelligence feeds${tenantId ? ` for tenant ${tenantId}` : ' for all tenants'}...`);
        
        try {
            const response = await axios.get(this.BLOCKLIST_URL);
            const ips = response.data
                .split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line && !line.startsWith('#') && this.isValidIp(line));

            this.logger.log(`📥 Downloaded ${ips.length} known malicious IPs.`);

            let tenantsToUpdate: string[] = [];
            if (tenantId) {
                tenantsToUpdate = [tenantId];
            } else {
                // Fetch all unique tenant IDs from users
                const users = await this.prisma.user.findMany({ select: { tenantId: true }, distinct: ['tenantId'] });
                tenantsToUpdate = users.map(u => u.tenantId).filter((id): id is string => id !== null);
            }

            let count = 0;
            const limit = 500; // Block first 500 for demo/performance purposes to avoid hammering DB
            
            for (const tid of tenantsToUpdate) {
                for (const ip of ips.slice(0, limit)) {
                    await this.firewallService.blockIp(
                        tid,
                        ip, 
                        'Global Threat Intelligence: Emerging Threats Blocklist', 
                        'critical'
                    );
                    count++;
                }
            }

            this.logger.log(`✅ Successfully updated local firewall with ${count} threat intelligence entries.`);
            await this.firewallService.refreshCache(tenantId);
        } catch (error: any) {
            this.logger.error(`❌ Failed to sync threat feeds: ${error.message}`);
            throw error;
        }
    }

    private isValidIp(ip: string): boolean {
        // Support both plain IPv4 and CIDR notation (e.g., 1.2.3.4 or 1.2.3.4/24)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/\d{1,2})?$/;
        return ipv4Regex.test(ip);
    }

    // Manual trigger for testing
    async triggerSync(tenantId: string) {
        return this.syncThreatFeeds(tenantId);
    }
}

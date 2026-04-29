import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirewallService } from '../firewall/firewall.service';
import axios from 'axios';

@Injectable()
export class ThreatIntelligenceService {
    private readonly logger = new Logger(ThreatIntelligenceService.name);
    private readonly BLOCKLIST_URL = 'https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt';

    constructor(private readonly firewallService: FirewallService) {}

    // Run every day at midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async syncThreatFeeds() {
        this.logger.log('🌐 Synchronizing global threat intelligence feeds...');
        
        try {
            const response = await axios.get(this.BLOCKLIST_URL);
            const ips = response.data
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && this.isValidIp(line));

            this.logger.log(`📥 Downloaded ${ips.length} known malicious IPs.`);

            let count = 0;
            // Block first 500 for demo/performance purposes to avoid hammering DB
            const limit = 500; 
            for (const ip of ips.slice(0, limit)) {
                await this.firewallService.blockIp(
                    ip, 
                    'Global Threat Intelligence: Emerging Threats Blocklist', 
                    'critical'
                );
                count++;
            }

            this.logger.log(`✅ Successfully updated local firewall with ${count} threat intelligence entries.`);
            await this.firewallService.refreshCache();
        } catch (error) {
            this.logger.error(`❌ Failed to sync threat feeds: ${error.message}`);
        }
    }

    private isValidIp(ip: string): boolean {
        // Support both plain IPv4 and CIDR notation (e.g., 1.2.3.4 or 1.2.3.4/24)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/\d{1,2})?$/;
        return ipv4Regex.test(ip);
    }

    // Manual trigger for testing
    async triggerSync() {
        return this.syncThreatFeeds();
    }
}

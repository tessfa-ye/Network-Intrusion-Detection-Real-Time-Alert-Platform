import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ThreatIntelligenceService } from './threat-intelligence.service';
import { FirewallService } from '../firewall/firewall.service';

@Controller('intelligence')
export class IntelligenceController {
    constructor(
        private readonly intelligenceService: ThreatIntelligenceService,
        private readonly firewallService: FirewallService
    ) {}

    @Post('sync')
    async syncFeeds() {
        await this.intelligenceService.triggerSync();
        return { message: 'Threat feeds synchronized successfully' };
    }

    @Get('stats')
    async getStats() {
        const blacklist = await this.firewallService.getBlacklist();
        const intelligenceCount = blacklist.filter(item => 
            item.reason?.includes('Global Threat Intelligence')
        ).length;
        
        return {
            total: blacklist.length,
            intelligence: intelligenceCount,
            manual: blacklist.length - intelligenceCount,
            activeInCache: this.firewallService.getCacheSize(),
            lastSync: new Date(),
        };
    }
}

import { Module } from '@nestjs/common';
import { FirewallModule } from '../firewall/firewall.module';
import { ThreatIntelligenceService } from './threat-intelligence.service';
import { IntelligenceController } from './intelligence.controller';

@Module({
    imports: [FirewallModule],
    providers: [ThreatIntelligenceService],
    controllers: [IntelligenceController],
    exports: [ThreatIntelligenceService],
})
export class IntelligenceModule {}

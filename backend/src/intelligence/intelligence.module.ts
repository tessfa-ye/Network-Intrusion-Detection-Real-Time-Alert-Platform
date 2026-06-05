import { Module } from '@nestjs/common';
import { FirewallModule } from '../firewall/firewall.module';
import { ThreatIntelligenceService } from './threat-intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [FirewallModule, PrismaModule],
    providers: [ThreatIntelligenceService],
    controllers: [IntelligenceController],
    exports: [ThreatIntelligenceService],
})
export class IntelligenceModule {}

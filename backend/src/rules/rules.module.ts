import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DetectionRule, DetectionRuleSchema } from './schemas/rule.schema';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { DetectionEngine } from './detection.engine';
import { EventsModule } from '../events/events.module';
import { AlertsModule } from '../alerts/alerts.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { FirewallModule } from '../firewall/firewall.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DetectionRule.name, schema: DetectionRuleSchema },
        ]),
        EventsModule,
        AlertsModule,
        AnalysisModule,
        FirewallModule,
    ],
    controllers: [RulesController],
    providers: [RulesService, DetectionEngine],
    exports: [RulesService, DetectionEngine],
})
export class RulesModule { }

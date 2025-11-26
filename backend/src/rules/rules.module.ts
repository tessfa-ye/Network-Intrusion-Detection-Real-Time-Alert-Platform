import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DetectionRule, DetectionRuleSchema } from './schemas/rule.schema';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { DetectionEngine } from './detection.engine';
import { EventsModule } from '../events/events.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DetectionRule.name, schema: DetectionRuleSchema },
        ]),
        EventsModule,
        AlertsModule,
    ],
    controllers: [RulesController],
    providers: [RulesService, DetectionEngine],
    exports: [RulesService, DetectionEngine],
})
export class RulesModule { }

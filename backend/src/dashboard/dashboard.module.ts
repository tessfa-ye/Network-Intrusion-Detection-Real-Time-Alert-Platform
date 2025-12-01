import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Alert, AlertSchema } from '../alerts/schemas/alert.schema';
import { SecurityEvent, SecurityEventSchema } from '../events/schemas/event.schema';
import { DetectionRule, DetectionRuleSchema } from '../rules/schemas/rule.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Alert.name, schema: AlertSchema },
            { name: SecurityEvent.name, schema: SecurityEventSchema },
            { name: DetectionRule.name, schema: DetectionRuleSchema },
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }

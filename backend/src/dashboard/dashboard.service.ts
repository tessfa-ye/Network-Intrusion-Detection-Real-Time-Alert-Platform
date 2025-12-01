import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from '../alerts/schemas/alert.schema';
import { SecurityEvent, SecurityEventDocument } from '../events/schemas/event.schema';
import { DetectionRule, DetectionRuleDocument } from '../rules/schemas/rule.schema';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
        @InjectModel(SecurityEvent.name) private eventModel: Model<SecurityEventDocument>,
        @InjectModel(DetectionRule.name) private ruleModel: Model<DetectionRuleDocument>,
    ) { }

    async getStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get total alerts
        const totalAlerts = await this.alertModel.countDocuments();

        // Get alerts from last hour
        const recentAlerts = await this.alertModel.countDocuments({
            createdAt: { $gte: oneHourAgo },
        });

        // Get total events
        const totalEvents = await this.eventModel.countDocuments();

        // Get events from last hour
        const recentEvents = await this.eventModel.countDocuments({
            timestamp: { $gte: oneHourAgo },
        });

        // Get active rules
        const activeRules = await this.ruleModel.countDocuments({
            enabled: true,
        });

        // Get severity distribution
        const severityDistribution = await this.alertModel.aggregate([
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 },
                },
            },
        ]);

        const distribution = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        severityDistribution.forEach((item) => {
            if (item._id in distribution) {
                distribution[item._id] = item.count;
            }
        });

        return {
            totalAlerts,
            activeEvents: totalEvents,
            systemHealth: 'Healthy',
            activeRules,
            alertsChange: recentAlerts,
            eventsChange: recentEvents,
            severityDistribution: distribution,
        };
    }
}

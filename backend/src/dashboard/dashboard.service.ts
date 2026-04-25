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

        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Aggregate events by hour for the last 24 hours
        const eventActivity = await this.eventModel.aggregate([
            { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Aggregate alerts by hour for the last 24 hours
        const alertActivity = await this.alertModel.aggregate([
            { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map into an hourly series 
        const activitySeries: Array<{time: string, events: number, alerts: number}> = [];
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const labelHour = time.getHours();
            const mongoUtcHour = time.getUTCHours();
            
            // MongoDB $hour operator returns the UTC hour
            const events = eventActivity.find(e => e._id === mongoUtcHour)?.count || 0;
            const alerts = alertActivity.find(a => a._id === mongoUtcHour)?.count || 0;
            
            activitySeries.push({
                time: `${labelHour.toString().padStart(2, '0')}:00`,
                events,
                alerts
            });
        }

        return {
            totalAlerts,
            activeEvents: totalEvents,
            systemHealth: 'Healthy',
            activeRules,
            alertsChange: recentAlerts,
            eventsChange: recentEvents,
            severityDistribution: distribution,
            activitySeries,
        };
    }
}

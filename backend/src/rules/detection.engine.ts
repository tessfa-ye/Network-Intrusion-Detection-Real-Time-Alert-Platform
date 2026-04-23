import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RulesService } from './rules.service';
import { EventsService } from '../events/events.service';
import { AlertsService } from '../alerts/alerts.service';
import { SecurityEvent } from '../events/schemas/event.schema';
import { DetectionRule } from './schemas/rule.schema';
import { AnalysisService } from '../analysis/analysis.service';

@Injectable()
export class DetectionEngine {
    constructor(
        private rulesService: RulesService,
        private eventsService: EventsService,
        private alertsService: AlertsService,
        private analysisService: AnalysisService,
    ) { }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async processEvents() {
        const events = await this.eventsService.findUnprocessed(200); // Larger batch
        if (events.length === 0) return;

        console.log(`🔍 Processing ${events.length} new events...`);
        const rules = await this.rulesService.getEnabledRules();
        const eventIds = events.map(e => (e as any)._id.toString());

        for (const rule of rules) {
            const triggeredGroups = await this.evaluateRule(rule, events);

            for (const [groupKey, triggeredEvents] of Object.entries(triggeredGroups)) {
                if (triggeredEvents.length > 0) {
                    // Calculate AI Anomaly Score
                    const anomalyScore = await this.analysisService.calculateAnomalyScore(
                        groupKey, 
                        rule.conditions[0].eventType, 
                        triggeredEvents.length
                    );

                    await this.createAlert(rule, triggeredEvents, anomalyScore);
                    
                    // Mark specifically triggered events as Alerted
                    const triggeredIds = triggeredEvents.map(e => (e as any)._id.toString());
                    await this.eventsService.markAsProcessed(triggeredIds, 'Alerted');
                }
            }
        }

        // Mark remaining non-triggering events as Processed
        const processedIds = events
            .filter(e => (e as any).status === 'Pending')
            .map(e => (e as any)._id.toString());
            
        await this.eventsService.markAsProcessed(processedIds, 'Processed');
    }

    private async evaluateRule(
        rule: DetectionRule,
        currentEvents: SecurityEvent[]
    ): Promise<Record<string, SecurityEvent[]>> {
        const triggeredGroups: Record<string, SecurityEvent[]> = {};
        
        try {
            const potentialEvents = currentEvents.filter(event => {
                return rule.conditions.every(cond => {
                    // Safety check: skip if condition is malformed
                    if (!cond || !cond.field) return false;
                    
                    if (cond.eventType && event.eventType !== cond.eventType) return false;
                    const val = this.getFieldValue(event, cond.field);
                    return this.evaluateCondition(val, cond.operator, cond.value);
                });
            });

            if (potentialEvents.length === 0) return {};

            // Group by Source IP
            const groups: Record<string, SecurityEvent[]> = {};
            potentialEvents.forEach(e => {
                const key = e.sourceIP || 'unknown';
                if (!groups[key]) groups[key] = [];
                groups[key].push(e);
            });

            for (const [ip, groupEvents] of Object.entries(groups)) {
                const cond = rule.conditions[0];
                if (cond && cond.threshold && cond.timeWindow) {
                    const startTime = new Date(Date.now() - (cond.timeWindow * 1000));
                    const history = await this.eventsService.findAll({
                        sourceIP: ip,
                        eventType: cond.eventType,
                        timestamp: { $gte: startTime }
                    }, 1000);

                    if (history.length >= cond.threshold) {
                        triggeredGroups[ip] = groupEvents;
                    }
                } else if (cond && cond.threshold) {
                    if (groupEvents.length >= cond.threshold) {
                        triggeredGroups[ip] = groupEvents;
                    }
                } else {
                    triggeredGroups[ip] = groupEvents;
                }
            }
        } catch (error) {
            console.error(`❌ Error evaluating rule "${rule.name}":`, error.message);
        }

        return triggeredGroups;
    }

    private getFieldValue(event: SecurityEvent, field: string): any {
        if (!field) return undefined;
        
        const parts = field.split('.');
        let value: any = event;

        for (const part of parts) {
            value = value?.[part];
        }

        return value;
    }

    private evaluateCondition(value: any, operator: string, expected: any): boolean {
        switch (operator) {
            case 'eq':
                return value === expected;
            case 'gt':
                return value > expected;
            case 'lt':
                return value < expected;
            case 'contains':
                return String(value).includes(String(expected));
            case 'regex':
                return new RegExp(expected).test(String(value));
            default:
                return false;
        }
    }

    private async createAlert(rule: DetectionRule, events: SecurityEvent[], anomalyScore: number = 0) {
        const ruleId = (rule as any)._id;
        const sourceIPs = [...new Set(events.map(e => e.sourceIP))];
        
        // Anti-spam: Check if a similar alert was created in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingAlerts = await this.alertsService.findAll({
            ruleId,
            status: 'pending',
            createdAt: { $gte: fiveMinutesAgo },
            affectedAssets: { $in: sourceIPs }
        }, 1);

        if (existingAlerts.length > 0) {
            console.log(`ℹ️ Skipping duplicate alert for rule ${rule.name}`);
            return;
        }

        const eventIds = events.map(e => (e as any)._id);
        const summary = `${rule.name}: ${events.length} event(s) detected [Anomaly Score: ${anomalyScore}]`;
        
        // Take location from the first event that has one
        const location = events.find(e => e.location)?.location;

        await this.alertsService.create({
            eventIds,
            ruleId,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'pending',
            summary,
            affectedAssets: sourceIPs,
            anomalyScore,
            location,
        } as any);
        
        console.log(`🚩 New Alert created: ${rule.name} (Anomaly: ${anomalyScore})`);
    }
}

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RulesService } from './rules.service';
import { EventsService } from '../events/events.service';
import { AlertsService } from '../alerts/alerts.service';
import { SecurityEvent } from '../events/schemas/event.schema';
import { DetectionRule } from './schemas/rule.schema';

@Injectable()
export class DetectionEngine {
    constructor(
        private rulesService: RulesService,
        private eventsService: EventsService,
        private alertsService: AlertsService,
    ) { }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async processEvents() {
        const events = await this.eventsService.findUnprocessed(100);
        if (events.length === 0) return;

        const rules = await this.rulesService.getEnabledRules();
        const eventIds = events.map(e => (e as any)._id.toString());

        for (const rule of rules) {
            const triggeredEvents = this.evaluateRule(rule, events);

            if (triggeredEvents.length > 0) {
                await this.createAlert(rule, triggeredEvents);
            }
        }

        await this.eventsService.markAsProcessed(eventIds);
    }

    private evaluateRule(rule: DetectionRule, events: SecurityEvent[]): SecurityEvent[] {
        const triggered: SecurityEvent[] = [];

        for (const event of events) {
            let allConditionsMet = true;

            for (const condition of rule.conditions) {
                if (condition.eventType && event.eventType !== condition.eventType) {
                    allConditionsMet = false;
                    break;
                }

                const fieldValue = this.getFieldValue(event, condition.field);

                if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
                    allConditionsMet = false;
                    break;
                }
            }

            if (allConditionsMet) {
                triggered.push(event);
            }
        }

        // Check threshold if specified
        const condition = rule.conditions[0];
        if (condition.threshold && triggered.length < condition.threshold) {
            return [];
        }

        return triggered;
    }

    private getFieldValue(event: SecurityEvent, field: string): any {
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

    private async createAlert(rule: DetectionRule, events: SecurityEvent[]) {
        const eventIds = events.map(e => (e as any)._id);
        const ruleId = (rule as any)._id;
        const summary = `${rule.name}: ${events.length} event(s) detected`;

        await this.alertsService.create({
            eventIds,
            ruleId,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'pending',
            summary,
            affectedAssets: [...new Set(events.map(e => e.sourceIP))],
        } as any);
    }
}

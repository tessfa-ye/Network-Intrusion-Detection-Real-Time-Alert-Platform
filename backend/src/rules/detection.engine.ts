import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RulesService } from './rules.service';
import { EventsService } from '../events/events.service';
import { AlertsService } from '../alerts/alerts.service';
import { SecurityEvent } from '../events/schemas/event.schema';
import { DetectionRule } from './schemas/rule.schema';
import { AnalysisService } from '../analysis/analysis.service';
import { FirewallService } from '../firewall/firewall.service';

@Injectable()
export class DetectionEngine {
    constructor(
        private rulesService: RulesService,
        private eventsService: EventsService,
        private alertsService: AlertsService,
        private analysisService: AnalysisService,
        private firewallService: FirewallService,
    ) { }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async processEvents() {
        const events = await this.eventsService.findUnprocessed(200); // Larger batch
        if (events.length === 0) return;

        console.log(`🔍 Processing ${events.length} new events...`);
        const rules = await this.rulesService.getEnabledRules();

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

                    // AUTO BLOCK: If the rule has autoBlock enabled, neutralize the IP instantly
                    if (rule.autoBlock && groupKey !== 'unknown') {
                        console.log(`🤖 SOAR: Auto-blocking IP ${groupKey} due to rule "${rule.name}"`);
                        await this.firewallService.blockIp(
                            groupKey, 
                            `Automated response triggered by rule: ${rule.name}`, 
                            rule.severity
                        );
                    }
                    
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
                return this.evaluateConditionTree(rule.conditions, event);
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
                triggeredGroups[ip] = groupEvents;
            }
        } catch (error) {
            console.error(`❌ Error evaluating rule "${rule.name}":`, error.message);
        }

        return triggeredGroups;
    }

    /**
     * Recursively evaluate a condition tree (group or leaf condition)
     * Supports both the new format {type:'group', operator:'AND', conditions:[...]}
     * and the old legacy flat format {field, operator, value}
     */
    private evaluateConditionTree(conditions: any, event: SecurityEvent): boolean {
        if (!conditions) return false;

        // Handle array (legacy flat format or root group array)
        if (Array.isArray(conditions)) {
            if (conditions.length === 0) return false;
            const first = conditions[0];
            // New format: first element is a group
            if (first?.type === 'group') {
                return this.evaluateConditionTree(first, event);
            }
            // Legacy format: flat array of conditions (AND all)
            return conditions.every(c => this.evaluateConditionTree(c, event));
        }

        // New GROUP node
        if (conditions.type === 'group') {
            const children: any[] = conditions.conditions || [];
            if (children.length === 0) return true;
            if (conditions.operator === 'OR') {
                return children.some(c => this.evaluateConditionTree(c, event));
            }
            return children.every(c => this.evaluateConditionTree(c, event));
        }

        // New LEAF condition node
        if (conditions.type === 'condition') {
            const { field, operator, value } = conditions;
            const eventVal = this.resolveField(event, field);
            return this.applyOperator(eventVal, operator, value);
        }

        // Legacy leaf: { field, operator, value }
        if (conditions.field) {
            const val = this.resolveField(event, conditions.field);
            return this.applyOperator(val, conditions.operator, conditions.value);
        }

        return false;
    }

    /**
     * Maps rule condition field names to actual SecurityEvent properties
     */
    private resolveField(event: SecurityEvent, field: string): any {
        const fieldMap: Record<string, (e: SecurityEvent) => any> = {
            'source_ip':        e => e.sourceIP,
            'destination_ip':   e => e.targetIP,
            'event_type':       e => e.eventType,
            'severity':         e => e.severity,
            'source_port':      e => e.metadata?.port,
            'destination_port': e => e.metadata?.port,
            'protocol':         e => e.metadata?.protocol,
            'status_code':      e => e.metadata?.statusCode,
            'method':           e => e.metadata?.method,
            'user_agent':       e => e.metadata?.userAgent,
            'path':             e => e.metadata?.path,
        };

        const resolver = fieldMap[field];
        if (resolver) return resolver(event);

        // Fallback: dotted field path for legacy compatibility
        return this.getFieldValue(event, field);
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

    /**
     * Apply new-style comparison operators
     */
    private applyOperator(value: any, operator: string, expected: any): boolean {
        const strVal = String(value ?? '').toLowerCase();
        const strExp = String(expected ?? '').toLowerCase();
        const numVal = parseFloat(value);
        const numExp = parseFloat(expected);

        switch (operator) {
            case 'equals':                  return strVal === strExp;
            case 'not_equals':              return strVal !== strExp;
            case 'contains':               return strVal.includes(strExp);
            case 'not_contains':           return !strVal.includes(strExp);
            case 'greater_than':           return !isNaN(numVal) && numVal > numExp;
            case 'less_than':              return !isNaN(numVal) && numVal < numExp;
            case 'greater_than_or_equal':  return !isNaN(numVal) && numVal >= numExp;
            case 'less_than_or_equal':     return !isNaN(numVal) && numVal <= numExp;
            case 'in':
                return Array.isArray(expected) ? expected.map((v: any) => String(v).toLowerCase()).includes(strVal) : strVal === strExp;
            case 'not_in':
                return Array.isArray(expected) ? !expected.map((v: any) => String(v).toLowerCase()).includes(strVal) : strVal !== strExp;
            case 'regex':
                try { return new RegExp(expected, 'i').test(String(value ?? '')); }
                catch { return false; }
            // Legacy operator support
            case 'eq':       return strVal === strExp;
            case 'gt':       return !isNaN(numVal) && numVal > numExp;
            case 'lt':       return !isNaN(numVal) && numVal < numExp;
            default:         return false;
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

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DetectionRule, DetectionRuleDocument } from './schemas/rule.schema';
import { SecurityEvent, SecurityEventDocument } from '../events/schemas/event.schema';

@Injectable()
export class RulesService {
    constructor(
        @InjectModel(DetectionRule.name)
        private ruleModel: Model<DetectionRuleDocument>,
        @InjectModel(SecurityEvent.name)
        private eventModel: Model<SecurityEventDocument>,
    ) { }

    async create(ruleData: Partial<DetectionRule>): Promise<DetectionRule> {
        const rule = new this.ruleModel(ruleData);
        return rule.save();
    }

    async findAll(enabled?: boolean): Promise<DetectionRule[]> {
        const filter = enabled !== undefined ? { enabled } : {};
        return this.ruleModel.find(filter).exec();
    }

    async findById(id: string): Promise<DetectionRule | null> {
        return this.ruleModel.findById(id).exec();
    }

    async update(id: string, updateData: Partial<DetectionRule>): Promise<DetectionRule | null> {
        // Don't include createdBy in updates
        const { createdBy, ...dataToUpdate } = updateData as any;
        return this.ruleModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).exec();
    }

    async delete(id: string): Promise<void> {
        await this.ruleModel.findByIdAndDelete(id).exec();
    }

    async getEnabledRules(): Promise<DetectionRule[]> {
        return this.ruleModel.find({ enabled: true }).exec();
    }

    async dryRun(ruleId: string, hoursBack = 24): Promise<{
        matchedEvents: number;
        totalScanned: number;
        matchRatePercent: number;
        topSourceIPs: { ip: string; count: number }[];
        severityBreakdown: Record<string, number>;
        eventTypeBreakdown: Record<string, number>;
        sampleEvents: any[];
        windowHours: number;
    }> {
        const rule = await this.ruleModel.findById(ruleId).exec();
        if (!rule) throw new Error('Rule not found');

        const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        const events = await this.eventModel.find({ timestamp: { $gte: since } }).lean().exec();

        // Inline condition evaluation to avoid circular DI with DetectionEngine
        const matched = events.filter(e => this.evaluateConditionTree(rule.conditions, e));

        // Top source IPs
        const ipCounts: Record<string, number> = {};
        matched.forEach(e => { ipCounts[e.sourceIP || 'unknown'] = (ipCounts[e.sourceIP || 'unknown'] || 0) + 1; });
        const topSourceIPs = Object.entries(ipCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ip, count]) => ({ ip, count }));

        // Severity breakdown
        const severityBreakdown: Record<string, number> = {};
        matched.forEach(e => { severityBreakdown[e.severity || 'unknown'] = (severityBreakdown[e.severity || 'unknown'] || 0) + 1; });

        // Event type breakdown
        const eventTypeBreakdown: Record<string, number> = {};
        matched.forEach(e => { eventTypeBreakdown[e.eventType || 'unknown'] = (eventTypeBreakdown[e.eventType || 'unknown'] || 0) + 1; });

        return {
            matchedEvents: matched.length,
            totalScanned: events.length,
            matchRatePercent: events.length > 0 ? Math.round((matched.length / events.length) * 100 * 10) / 10 : 0,
            topSourceIPs,
            severityBreakdown,
            eventTypeBreakdown,
            sampleEvents: matched.slice(0, 5).map(e => ({
                timestamp: e.timestamp,
                sourceIP: e.sourceIP,
                eventType: e.eventType,
                severity: e.severity,
                description: e.description,
            })),
            windowHours: hoursBack,
        };
    }

    /** Recursively evaluate a condition tree against an event */
    private evaluateConditionTree(conditions: any, event: any): boolean {
        if (!conditions) return false;

        if (Array.isArray(conditions)) {
            if (conditions.length === 0) return false;
            const first = conditions[0];
            if (first?.type === 'group') return this.evaluateConditionTree(first, event);
            return conditions.every(c => this.evaluateConditionTree(c, event));
        }

        if (conditions.type === 'group') {
            const children: any[] = conditions.conditions || [];
            if (children.length === 0) return true;
            if (conditions.operator === 'OR') return children.some(c => this.evaluateConditionTree(c, event));
            return children.every(c => this.evaluateConditionTree(c, event));
        }

        if (conditions.type === 'condition') {
            const { field, operator, value } = conditions;
            const eventVal = this.resolveField(event, field);
            return this.applyOperator(eventVal, operator, value);
        }

        if (conditions.field) {
            const val = this.resolveField(event, conditions.field);
            return this.applyOperator(val, conditions.operator, conditions.value);
        }

        return false;
    }

    private resolveField(event: any, field: string): any {
        const fieldMap: Record<string, (e: any) => any> = {
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
        // dotted path fallback
        return field.split('.').reduce((v, k) => v?.[k], event);
    }

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
                try { return new RegExp(expected, 'i').test(String(value ?? '')); } catch { return false; }
            case 'eq': return strVal === strExp;
            case 'gt': return !isNaN(numVal) && numVal > numExp;
            case 'lt': return !isNaN(numVal) && numVal < numExp;
            default:   return false;
        }
    }
}

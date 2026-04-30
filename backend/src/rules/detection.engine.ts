/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars, @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RulesService } from './rules.service';
import { EventsService } from '../events/events.service';
import { AlertsService } from '../alerts/alerts.service';
import { DetectionRule, SecurityEvent } from '@prisma/client';
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
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processEvents() {
    const events = await this.eventsService.findUnprocessed(200);
    if (events.length === 0) return;

    console.log(`🔍 Processing ${events.length} new events...`);
    const rules = await this.rulesService.getEnabledRules();

    for (const rule of rules) {
      const triggeredGroups = await this.evaluateRule(rule, events);

      for (const [groupKey, triggeredEvents] of Object.entries(
        triggeredGroups,
      )) {
        if (triggeredEvents.length > 0) {
          // Calculate AI Anomaly Score
          // Use eventType from first condition if possible
          const conditions: any = rule.conditions;
          const eventType = Array.isArray(conditions)
            ? conditions[0]?.eventType
            : conditions?.eventType;

          const anomalyScore = await this.analysisService.calculateAnomalyScore(
            groupKey,
            eventType || 'unknown',
            triggeredEvents.length,
          );

          await this.createAlert(rule, triggeredEvents, anomalyScore);

          // AUTO BLOCK: If the rule has autoBlock enabled, neutralize the IP instantly
          if (rule.autoBlock && groupKey !== 'unknown') {
            console.log(
              `🤖 SOAR: Auto-blocking IP ${groupKey} due to rule "${rule.name}"`,
            );
            await this.firewallService.blockIp(
              groupKey,
              `Automated response triggered by rule: ${rule.name}`,
              rule.severity,
            );
          }

          // Mark specifically triggered events as Alerted
          const triggeredIds = triggeredEvents.map((e) => e.id);
          await this.eventsService.markAsProcessed(triggeredIds, 'Alerted');
        }
      }
    }

    // Mark remaining non-triggering events as Processed
    const processedIds = events
      .filter((e) => e.status === 'Pending')
      .map((e) => e.id);

    await this.eventsService.markAsProcessed(processedIds, 'Processed');
  }

  private async evaluateRule(
    rule: DetectionRule,
    currentEvents: SecurityEvent[],
  ): Promise<Record<string, SecurityEvent[]>> {
    const triggeredGroups: Record<string, SecurityEvent[]> = {};

    try {
      const potentialEvents = currentEvents.filter((event) => {
        return this.evaluateConditionTree(rule.conditions, event);
      });

      if (potentialEvents.length === 0) return {};

      // Group by Source IP
      const groups: Record<string, SecurityEvent[]> = {};
      potentialEvents.forEach((e) => {
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

  public evaluateConditionTree(conditions: any, event: SecurityEvent): boolean {
    if (!conditions) return false;

    // Handle array
    if (Array.isArray(conditions)) {
      if (conditions.length === 0) return false;
      const first = conditions[0];
      if (first?.type === 'group') {
        return this.evaluateConditionTree(first, event);
      }
      return conditions.every((c) => this.evaluateConditionTree(c, event));
    }

    if (conditions.type === 'group') {
      const children: any[] = conditions.conditions || [];
      if (children.length === 0) return true;
      if (conditions.operator === 'OR') {
        return children.some((c) => this.evaluateConditionTree(c, event));
      }
      return children.every((c) => this.evaluateConditionTree(c, event));
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

  private resolveField(event: SecurityEvent, field: string): any {
    const metadata: any = event.metadata || {};
    const fieldMap: Record<string, (e: SecurityEvent) => any> = {
      source_ip: (e) => e.sourceIP,
      destination_ip: (e) => e.targetIP,
      event_type: (e) => e.eventType,
      severity: (e) => e.severity,
      source_port: (e) => metadata.port,
      destination_port: (e) => metadata.port,
      protocol: (e) => metadata.protocol,
      status_code: (e) => metadata.statusCode,
      method: (e) => metadata.method,
      user_agent: (e) => metadata.userAgent,
      path: (e) => metadata.path,
    };

    const resolver = fieldMap[field];
    if (resolver) return resolver(event);

    // Fallback: dotted field path
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

  private applyOperator(value: any, operator: string, expected: any): boolean {
    const strVal = String(value ?? '').toLowerCase();
    const strExp = String(expected ?? '').toLowerCase();
    const numVal = parseFloat(value);
    const numExp = parseFloat(expected);

    switch (operator) {
      case 'equals':
        return strVal === strExp;
      case 'not_equals':
        return strVal !== strExp;
      case 'contains':
        return strVal.includes(strExp);
      case 'not_contains':
        return !strVal.includes(strExp);
      case 'greater_than':
        return !isNaN(numVal) && numVal > numExp;
      case 'less_than':
        return !isNaN(numVal) && numVal < numExp;
      case 'greater_than_or_equal':
        return !isNaN(numVal) && numVal >= numExp;
      case 'less_than_or_equal':
        return !isNaN(numVal) && numVal <= numExp;
      case 'in':
        return Array.isArray(expected)
          ? expected.map((v: any) => String(v).toLowerCase()).includes(strVal)
          : strVal === strExp;
      case 'not_in':
        return Array.isArray(expected)
          ? !expected.map((v: any) => String(v).toLowerCase()).includes(strVal)
          : strVal !== strExp;
      case 'regex':
        try {
          return new RegExp(expected, 'i').test(String(value ?? ''));
        } catch {
          return false;
        }
      case 'eq':
        return strVal === strExp;
      case 'gt':
        return !isNaN(numVal) && numVal > numExp;
      case 'lt':
        return !isNaN(numVal) && numVal < numExp;
      default:
        return false;
    }
  }

  private async createAlert(
    rule: DetectionRule,
    events: SecurityEvent[],
    anomalyScore: number = 0,
  ) {
    const ruleId = rule.id;
    const sourceIPs = [...new Set(events.map((e) => e.sourceIP))];

    // Anti-spam: Check if a similar alert was created in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingAlerts = await this.alertsService.findAll(
      {
        ruleId,
        status: 'pending',
        createdAt: { gte: fiveMinutesAgo },
        affectedAssets: { hasSome: sourceIPs },
      },
      1,
    );

    if (existingAlerts.length > 0) {
      console.log(`ℹ️ Skipping duplicate alert for rule ${rule.name}`);
      return;
    }

    const eventIds = events.map((e) => e.id);
    const summary = `${rule.name}: ${events.length} event(s) detected [Anomaly Score: ${anomalyScore}]`;

    const location = events.find((e) => e.location)?.location || null;

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

    console.log(
      `🚩 New Alert created: ${rule.name} (Anomaly: ${anomalyScore})`,
    );
  }
}

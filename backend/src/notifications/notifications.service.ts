/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Dispatch an alert notification to all configured channels for a tenant
     */
    async dispatch(tenantId: string, alert: any): Promise<void> {
        try {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { notificationConfig: true, name: true },
            });

            if (!tenant) return;

            const config: any = tenant.notificationConfig;
            const channels = config?.channels || {};

            // Email notifications
            if (channels.email?.enabled && channels.email?.recipients?.length > 0) {
                await this.sendEmail(channels.email.recipients, alert, tenant.name);
            }

            // Slack notifications
            if (channels.slack?.enabled && channels.slack?.webhookUrl) {
                await this.sendSlack(channels.slack.webhookUrl, alert, tenant.name);
            }

            // Generic webhook notifications
            if (channels.webhook?.enabled && channels.webhook?.url) {
                await this.sendWebhook(channels.webhook.url, channels.webhook.secret, alert);
            }

            // Push notifications (log intent for now)
            if (channels.push?.enabled) {
                const minSeverity = channels.push.minSeverity || 'high';
                if (this.isSeveritySufficient(alert.severity, minSeverity)) {
                    this.logger.log(`📱 Push notification queued for tenant ${tenantId}: ${alert.summary}`);
                }
            }
        } catch (error) {
            this.logger.error(`❌ Notification dispatch failed for tenant ${tenantId}: ${error.message}`);
        }
    }

    private async sendEmail(recipients: string[], alert: any, orgName: string): Promise<void> {
        // Log intent — full email integration requires nodemailer + SMTP config
        this.logger.log(
            `📧 Email alert to [${recipients.join(', ')}]: [${orgName}] ${alert.severity.toUpperCase()} - ${alert.summary}`,
        );
    }

    private async sendSlack(webhookUrl: string, alert: any, orgName: string): Promise<void> {
        try {
            const severityEmoji: Record<string, string> = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🟢',
            };
            const emoji = severityEmoji[alert.severity] || '⚪';

            await axios.post(webhookUrl, {
                text: `${emoji} *[${orgName}] NIDAS Alert*`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${emoji} *[${orgName}] ${alert.severity.toUpperCase()} Alert*\n${alert.summary}\n\n*Rule:* ${alert.ruleName}\n*Affected:* ${alert.affectedAssets?.join(', ') || 'N/A'}`,
                        },
                    },
                ],
            });
            this.logger.log(`💬 Slack notification sent for alert ${alert.id}`);
        } catch (error) {
            this.logger.error(`❌ Slack notification failed: ${error.message}`);
        }
    }

    private async sendWebhook(url: string, secret: string, alert: any): Promise<void> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (secret) {
                headers['x-webhook-secret'] = secret;
            }

            await axios.post(url, {
                event: 'alert.created',
                timestamp: new Date().toISOString(),
                data: alert,
            }, { headers });

            this.logger.log(`🔗 Webhook notification sent to ${url}`);
        } catch (error) {
            this.logger.error(`❌ Webhook notification failed: ${error.message}`);
        }
    }

    private isSeveritySufficient(alertSeverity: string, minSeverity: string): boolean {
        const levels: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        return (levels[alertSeverity] || 0) >= (levels[minSeverity] || 0);
    }
}

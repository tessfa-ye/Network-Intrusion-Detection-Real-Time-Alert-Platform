import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalAlerts,
      recentAlerts,
      totalEvents,
      recentEvents,
      activeRules,
      severityDistribution,
      eventActivity,
      alertActivity,
    ] = await Promise.all([
      this.prisma.alert.count(),
      this.prisma.alert.count({ where: { createdAt: { gte: oneHourAgo } } }),
      this.prisma.securityEvent.count(),
      this.prisma.securityEvent.count({
        where: { timestamp: { gte: oneHourAgo } },
      }),
      this.prisma.detectionRule.count({ where: { enabled: true } }),
      this.prisma.alert.groupBy({
        by: ['severity'],
        _count: { severity: true },
      }),
      this.prisma.$queryRaw<
        { hour: string | number; count: bigint | number }[]
      >`
                SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count 
                FROM "SecurityEvent" 
                WHERE timestamp >= ${twentyFourHoursAgo} 
                GROUP BY hour
            `,
      this.prisma.$queryRaw<
        { hour: string | number; count: bigint | number }[]
      >`
                SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count 
                FROM "Alert" 
                WHERE "createdAt" >= ${twentyFourHoursAgo} 
                GROUP BY hour
            `,
    ]);

    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    severityDistribution.forEach((item) => {
      if (item.severity in distribution) {
        distribution[item.severity as keyof typeof distribution] =
          item._count.severity;
      }
    });

    const activitySeries: Array<{
      time: string;
      events: number;
      alerts: number;
    }> = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const labelHour = time.getHours();
      const utcHour = time.getUTCHours();

      const events = Number(
        eventActivity.find((e) => Number(e.hour) === utcHour)?.count || 0,
      );
      const alerts = Number(
        alertActivity.find((a) => Number(a.hour) === utcHour)?.count || 0,
      );

      activitySeries.push({
        time: `${labelHour.toString().padStart(2, '0')}:00`,
        events,
        alerts,
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

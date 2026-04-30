import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from './events/events.module';
import { AlertsModule } from './alerts/alerts.module';
import { RulesModule } from './rules/rules.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WebsocketModule } from './websocket/websocket.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalysisModule } from './analysis/analysis.module';
import { FirewallModule } from './firewall/firewall.module';
import { IntelligenceModule } from './intelligence/intelligence.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '.env.backend'],
        }),
        PrismaModule,
        ScheduleModule.forRoot(),
        AuthModule,
        UsersModule,
        EventsModule,
        AlertsModule,
        RulesModule,
        DashboardModule,
        WebsocketModule,
        AnalysisModule,
        FirewallModule,
        IntelligenceModule,
    ],
})
// Force re-compilation
export class AppModule { }


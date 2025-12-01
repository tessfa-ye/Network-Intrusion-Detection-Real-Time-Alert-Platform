'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, ShieldCheck, Server } from 'lucide-react';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { LatestAlerts } from '@/components/dashboard/latest-alerts';
import { SeverityChart } from '@/components/dashboard/severity-chart';

interface DashboardStats {
    totalAlerts: number;
    activeEvents: number;
    systemHealth: string;
    activeRules: number;
    alertsChange: number;
    eventsChange: number;
    severityDistribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalAlerts: 0,
        activeEvents: 0,
        systemHealth: 'Healthy',
        activeRules: 0,
        alertsChange: 0,
        eventsChange: 0,
        severityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        },
    });

    // Fetch initial stats
    const { data } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/dashboard/stats');
            return response.data as DashboardStats;
        },
    });

    useEffect(() => {
        if (data) {
            setStats(data);
        }
    }, [data]);

    // WebSocket real-time updates
    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();

            socket.emit('subscribe:stats');

            socket.on('stats:updated', (newStats: DashboardStats) => {

                setStats(newStats);
            });

            return () => {
                socket.off('stats:updated');
            };
        }
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.alertsChange >= 0 ? '+' : ''}{stats.alertsChange} from last hour
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeEvents}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.eventsChange >= 0 ? '+' : ''}{stats.eventsChange} from last hour
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Server className={`h-4 w-4 ${stats.systemHealth === 'Healthy' ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.systemHealth}</div>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeRules}</div>
                        <p className="text-xs text-muted-foreground">Detection rules enabled</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ActivityChart />
                    </CardContent>
                </Card>
                <SeverityChart data={stats.severityDistribution} />
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Latest Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LatestAlerts />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

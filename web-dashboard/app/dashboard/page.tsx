'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, ShieldCheck, Server } from 'lucide-react';
import dynamic from 'next/dynamic';

const ActivityChart = dynamic(() => import('@/components/dashboard/activity-chart').then(mod => mod.ActivityChart), {
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted" />,
    ssr: false
});
const LatestAlerts = dynamic(() => import('@/components/dashboard/latest-alerts').then(mod => mod.LatestAlerts), {
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted" />,
    ssr: false
});
const SeverityChart = dynamic(() => import('@/components/dashboard/severity-chart').then(mod => mod.SeverityChart), {
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted" />,
    ssr: false
});
const LiveEventFeed = dynamic(() => import('@/components/dashboard/live-event-feed').then(mod => mod.LiveEventFeed), {
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted" />,
    ssr: false
});
const ThreatMap = dynamic(() => import('@/components/dashboard/threat-map').then(mod => mod.ThreatMap), {
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted" />,
    ssr: false
});
import StatsSkeleton from '@/components/skeletons/stats-skeleton';

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

interface AlertData {
    _id: string;
    severity: string;
    location?: {
        lat: number;
        lon: number;
        city: string;
        country: string;
    };
}

export default function DashboardPage() {
    const [alerts, setAlerts] = useState<AlertData[]>([]);
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
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/dashboard/stats');
            return response.data as DashboardStats;
        },
    });

    // Fetch latest alerts for the map
    const { data: alertsData } = useQuery({
        queryKey: ['latest-alerts-map'],
        queryFn: async () => {
            const response = await api.get('/alerts?limit=50');
            return response.data as AlertData[];
        },
    });

    useEffect(() => {
        if (statsData) setStats(statsData);
    }, [statsData]);

    useEffect(() => {
        if (alertsData) setAlerts(alertsData);
    }, [alertsData]);

    // WebSocket real-time updates
    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();

            socket.emit('subscribe:stats');
            socket.emit('subscribe:alerts');

            socket.on('stats:updated', (newStats: DashboardStats) => {
                setStats(newStats);
            });

            socket.on('alert:new', (newAlert: AlertData) => {
                setAlerts(prev => [newAlert, ...prev].slice(0, 50));
            });

            return () => {
                socket.off('stats:updated');
                socket.off('alert:new');
            };
        }
    }, []);

    // Extract points for map
    const threatPoints = alerts
        .filter(a => a.location?.lat && a.location?.lon)
        .map(a => ({
            id: a._id,
            lat: a.location!.lat,
            lon: a.location!.lon,
            severity: a.severity,
            city: a.location?.city
        }));

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Operations Center</h1>
                    <p className="text-muted-foreground">Monitoring real-time network threats and system integrity.</p>
                </div>
                <div className="flex gap-2 items-center px-4 py-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-xs font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Threat Level: Minimal
                </div>
            </div>

            {isStatsLoading ? (
                <StatsSkeleton />
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.alertsChange >= 0 ? '+' : ''}{stats.alertsChange} from last hour
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeEvents}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.eventsChange >= 0 ? '+' : ''}{stats.eventsChange} from last hour
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <Server className={`h-4 w-4 ${stats.systemHealth === 'Healthy' ? 'text-green-500' : 'text-red-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.systemHealth}</div>
                            <p className="text-xs text-muted-foreground">Real-time status</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeRules}</div>
                            <p className="text-xs text-muted-foreground">Detection engine active</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Overview Section */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-md flex items-center gap-2">
                             <Activity className="h-4 w-4 text-blue-500" /> Network Volume (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 min-h-[350px]">
                        <ActivityChart />
                    </CardContent>
                </Card>
                <div className="col-span-1 lg:col-span-3 w-full h-full min-h-[350px]">
                    <LiveEventFeed />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 lg:col-span-2">
                   <SeverityChart data={stats.severityDistribution} />
                </div>
                <Card className="col-span-1 lg:col-span-5 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 text-orange-500" /> Latest High-Priority Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <LatestAlerts />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

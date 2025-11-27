'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LatestAlert {
    ruleName: string;
    severity: string;
    sourceIP: string;
    timeAgo: string;
}

export function LatestAlerts() {
    const { data } = useQuery({
        queryKey: ['latest-alerts'],
        queryFn: async () => {
            const response = await api.get('/alerts?limit=3');
            return response.data as Alert[];
        },
    });

    const alerts = useMemo<LatestAlert[]>(() => {
        if (!data) return [];
        return data.map((alert) => {
            const createdAt = new Date(alert.createdAt);
            const now = new Date();
            const diffMs = now.getTime() - createdAt.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            let timeAgo = '';
            if (diffMins < 1) {
                timeAgo = 'Just now';
            } else if (diffMins < 60) {
                timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
            } else {
                const diffHours = Math.floor(diffMins / 60);
                timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            }

            return {
                ruleName: alert.ruleName,
                severity: alert.severity,
                sourceIP: alert.affectedAssets[0] || 'Unknown',
                timeAgo,
            };
        });
    }, [data]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-500';
            case 'high': return 'text-orange-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-4">
            {alerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                    No recent alerts
                </div>
            ) : (
                alerts.map((alert, i) => (
                    <div key={i} className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {alert.ruleName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {alert.sourceIP} • {alert.timeAgo}
                            </p>
                        </div>
                        <div className={`ml-auto font-medium ${getSeverityColor(alert.severity)} capitalize`}>
                            {alert.severity}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActivityData {
    time: string;
    events: number;
    alerts: number;
}

export function ActivityChart() {
    const [data, setData] = useState<ActivityData[]>([]);

    useEffect(() => {
        // Generate sample data for the last 24 hours
        const now = new Date();
        const sampleData: ActivityData[] = [];

        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            sampleData.push({
                time: time.getHours() + ':00',
                events: Math.floor(Math.random() * 100) + 20,
                alerts: Math.floor(Math.random() * 20) + 1,
            });
        }

        setData(sampleData);
    }, []);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    interval={3}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="events"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Events"
                />
                <Line
                    type="monotone"
                    dataKey="alerts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Alerts"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

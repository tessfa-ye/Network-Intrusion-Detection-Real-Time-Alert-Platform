'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActivityData {
    time: string;
    events: number;
    alerts: number;
}

interface ActivityChartProps {
    data?: ActivityData[];
}

export function ActivityChart({ data = [] }: ActivityChartProps) {

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

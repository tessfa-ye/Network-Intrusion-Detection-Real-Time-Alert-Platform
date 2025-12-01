'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SeverityChartProps {
    data: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

export function SeverityChart({ data }: SeverityChartProps) {
    const chartData = [
        { name: 'Critical', value: data.critical, color: '#ef4444' }, // red-500
        { name: 'High', value: data.high, color: '#f97316' },     // orange-500
        { name: 'Medium', value: data.medium, color: '#eab308' },   // yellow-500
        { name: 'Low', value: data.low, color: '#3b82f6' },      // blue-500
    ].filter(item => item.value > 0);

    if (chartData.length === 0) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Alert Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No alerts data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Alert Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const severityColors = {
    critical: 'bg-red-500 hover:bg-red-600',
    high: 'bg-orange-500 hover:bg-orange-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    low: 'bg-blue-500 hover:bg-blue-600',
};

const statusColors = {
    pending: 'bg-gray-500',
    investigating: 'bg-blue-500',
    resolved: 'bg-green-500',
    escalated: 'bg-purple-500',
    false_positive: 'bg-gray-400',
};

export default function AlertsPage() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
            const response = await api.get('/alerts');
            return response.data as Alert[];
        },
    });

    useEffect(() => {
        if (data) {
            setAlerts(data);
        }
    }, [data]);

    // WebSocket real-time updates
    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();

            socket.emit('subscribe:alerts');

            socket.on('alert:new', (newAlert: Alert) => {
                console.log('🔔 New alert received:', newAlert);
                setAlerts((prev) => [newAlert, ...prev]);
                toast.info(`New ${newAlert.severity.toUpperCase()} alert: ${newAlert.ruleName}`);
            });

            socket.on('alert:updated', (updatedAlert: Alert) => {
                console.log('🔄 Alert updated:', updatedAlert);
                setAlerts((prev) =>
                    prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
                );
            });

            return () => {
                socket.off('alert:new');
                socket.off('alert:updated');
            };
        }
    }, []);

    const filteredAlerts = alerts.filter((alert) => {
        if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
        if (selectedStatus !== 'all' && alert.status !== selectedStatus) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Alerts Management</h1>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="flex gap-4">
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="false_positive">False Positive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Alerts ({filteredAlerts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rule Name</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Summary</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAlerts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No alerts found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAlerts.map((alert) => (
                                        <TableRow
                                            key={alert._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/dashboard/alerts/${alert._id}`)}
                                        >
                                            <TableCell className="font-medium">{alert.ruleName}</TableCell>
                                            <TableCell>
                                                <Badge className={severityColors[alert.severity]}>
                                                    {alert.severity.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={statusColors[alert.status]}>
                                                    {alert.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate">{alert.summary}</TableCell>
                                            <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

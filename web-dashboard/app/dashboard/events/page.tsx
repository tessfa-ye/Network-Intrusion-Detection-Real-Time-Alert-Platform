'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { SecurityEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToDOC, generateFilename } from '@/lib/export-utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const severityColors = {
    critical: 'bg-red-500 hover:bg-red-600',
    high: 'bg-orange-500 hover:bg-orange-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    low: 'bg-blue-500 hover:bg-blue-600',
};

export default function EventsPage() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedEventType, setSelectedEventType] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['events', selectedSeverity, selectedEventType],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (selectedSeverity !== 'all') params.severity = selectedSeverity;
            if (selectedEventType !== 'all') params.eventType = selectedEventType;

            const response = await api.get('/events', { params });
            return response.data as SecurityEvent[];
        },
    });

    useEffect(() => {
        if (data) {
            setEvents(data);
        }
    }, [data]);

    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();

            socket.emit('subscribe:events');

            socket.on('event:new', (newEvent: SecurityEvent) => {

                setEvents((prev: SecurityEvent[]) => [newEvent, ...prev]);
                toast.info(`New ${newEvent.severity.toUpperCase()} event: ${newEvent.eventType}`);
            });

            return () => {
                socket.off('event:new');
            };
        }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleExport = (format: string) => {
        if (!events || events.length === 0) {
            toast.error('No events to export');
            return;
        }

        const headers = ['Event Type', 'Severity', 'Source IP', 'Description', 'Processed', 'Timestamp'];
        const keys: (keyof SecurityEvent)[] = ['eventType', 'severity', 'sourceIP', 'description', 'processed', 'timestamp'];

        if (format === 'csv') {
            exportToCSV(events, generateFilename('events'), headers, keys);
            toast.success(`Exported ${events.length} events as CSV`);
        } else if (format === 'doc') {
            exportToDOC(events, generateFilename('events'), 'Security Events Report', headers, keys);
            toast.success(`Exported ${events.length} events as DOC`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Security Events</h1>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('doc')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export as DOC
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
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

                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="intrusion">Intrusion</SelectItem>
                        <SelectItem value="malware">Malware</SelectItem>
                        <SelectItem value="auth_failure">Auth Failure</SelectItem>
                        <SelectItem value="system_anomaly">System Anomaly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Events ({events.length})</CardTitle>
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
                                    <TableHead>Event Type</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Source IP</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Processed</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!events || events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No events found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.map((event) => (
                                        <TableRow key={event._id}>
                                            <TableCell className="font-medium capitalize">{event.eventType}</TableCell>
                                            <TableCell>
                                                <Badge className={severityColors[event.severity]}>
                                                    {event.severity.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{event.sourceIP}</TableCell>
                                            <TableCell className="max-w-md truncate">{event.description}</TableCell>
                                            <TableCell>
                                                {event.processed ? (
                                                    <Badge variant="outline" className="bg-green-500">Processed</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-gray-400">Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
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

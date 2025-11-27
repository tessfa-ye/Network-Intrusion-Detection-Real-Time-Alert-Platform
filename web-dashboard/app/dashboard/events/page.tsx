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
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const severityColors = {
    critical: 'bg-red-500 hover:bg-red-600',
    high: 'bg-orange-500 hover:bg-orange-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    low: 'bg-blue-500 hover:bg-blue-600',
};

export default function EventsPage() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await api.get('/events');
            return response.data as SecurityEvent[];
        },
    });

    useEffect(() => {
        if (data) {
            setEvents(data);
        }
    }, [data]);

    // WebSocket real-time updates
    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();

            socket.emit('subscribe:events');

            socket.on('event:new', (newEvent: SecurityEvent) => {
                console.log('🔔 New event received:', newEvent);
                setEvents((prev) => [newEvent, ...prev]);
                toast.info(`New ${newEvent.severity.toUpperCase()} event: ${newEvent.eventType}`);
            });

            return () => {
                socket.off('event:new');
            };
        }
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Security Events</h1>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
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

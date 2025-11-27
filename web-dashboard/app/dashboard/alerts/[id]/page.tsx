'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const severityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
};

const statusColors = {
    pending: 'bg-gray-500',
    investigating: 'bg-blue-500',
    resolved: 'bg-green-500',
    escalated: 'bg-purple-500',
    false_positive: 'bg-gray-400',
};

export default function AlertDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const alertId = params.id as string;

    const [newNote, setNewNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const { data: alert, isLoading } = useQuery({
        queryKey: ['alert', alertId],
        queryFn: async () => {
            const response = await api.get(`/alerts/${alertId}`);
            return response.data as Alert;
        },
    });

    useEffect(() => {
        if (alert) {
            setSelectedStatus(alert.status);
        }
    }, [alert]);

    const addNoteMutation = useMutation({
        mutationFn: async (note: string) => {
            await api.post(`/alerts/${alertId}/notes`, { note });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert', alertId] });
            setNewNote('');
            toast.success('Note added successfully');
        },
        onError: () => {
            toast.error('Failed to add note');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            await api.patch(`/alerts/${alertId}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert', alertId] });
            toast.success('Status updated successfully');
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    const handleAddNote = () => {
        if (newNote.trim()) {
            addNoteMutation.mutate(newNote);
        }
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        updateStatusMutation.mutate(status);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!alert) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Alert not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Alert Details</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Alert Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Rule Name</p>
                            <p className="text-lg font-semibold">{alert.ruleName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Severity</p>
                            <Badge className={severityColors[alert.severity]}>
                                {alert.severity.toUpperCase()}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="investigating">Investigating</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="escalated">Escalated</SelectItem>
                                    <SelectItem value="false_positive">False Positive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Summary</p>
                            <p className="text-sm">{alert.summary}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Affected Assets</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {alert.affectedAssets.map((asset, i) => (
                                    <Badge key={i} variant="outline">{asset}</Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Created At</p>
                            <p className="text-sm">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Investigation Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {alert.investigationNotes && alert.investigationNotes.length > 0 ? (
                                alert.investigationNotes.map((note, i) => (
                                    <div key={i} className="border-l-2 border-primary pl-4 py-2">
                                        <p className="text-sm">{note.note}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {note.userName || 'Unknown'} • {new Date(note.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No investigation notes yet</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Add investigation note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={3}
                            />
                            <Button
                                onClick={handleAddNote}
                                disabled={!newNote.trim() || addNoteMutation.isPending}
                                className="w-full"
                            >
                                {addNoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Note
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

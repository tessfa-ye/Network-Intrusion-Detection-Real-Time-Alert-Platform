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
import { Loader2, RefreshCw, Download, FileText, CheckSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToDOC, generateFilename } from '@/lib/export-utils';
import { BulkActionDialog } from '@/components/alerts/bulk-action-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AssignUserSelect } from '@/components/alerts/assign-user-select';
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
    const [bulkActionDialog, setBulkActionDialog] = useState<{
        open: boolean;
        action: 'resolved' | 'investigating' | 'false_positive' | 'delete';
    }>({ open: false, action: 'resolved' });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['alerts', selectedSeverity, selectedStatus],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (selectedSeverity !== 'all') params.severity = selectedSeverity;
            if (selectedStatus !== 'all') params.status = selectedStatus;

            const response = await api.get('/alerts', { params });
            return response.data as Alert[];
        },
    });

    useEffect(() => {
        if (data) {
            setAlerts(data);
        }
    }, [data]);

    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();

            socket.emit('subscribe:alerts');

            socket.on('alert:new', (newAlert: Alert) => {

                setAlerts((prev: Alert[]) => [newAlert, ...prev]);
                toast.info(`New ${newAlert.severity.toUpperCase()} alert: ${newAlert.ruleName}`);
            });

            socket.on('alert:updated', (updatedAlert: Alert) => {

                setAlerts((prev: Alert[]) =>
                    prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
                );
            });

            return () => {
                socket.off('alert:new');
                socket.off('alert:updated');
            };
        }
    }, []);

    const filteredAlerts = alerts;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleExport = (format: string) => {
        if (!filteredAlerts || filteredAlerts.length === 0) {
            toast.error('No alerts to export');
            return;
        }

        const headers = ['Rule Name', 'Severity', 'Status', 'Summary', 'Created'];
        const keys: (keyof Alert)[] = ['ruleName', 'severity', 'status', 'summary', 'createdAt'];

        if (format === 'csv') {
            exportToCSV(filteredAlerts, generateFilename('alerts'), headers, keys);
            toast.success(`Exported ${filteredAlerts.length} alerts as CSV`);
        } else if (format === 'doc') {
            exportToDOC(filteredAlerts, generateFilename('alerts'), 'Alerts Report', headers, keys);
            toast.success(`Exported ${filteredAlerts.length} alerts as DOC`);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAlerts(new Set(filteredAlerts.map(a => a._id)));
        } else {
            setSelectedAlerts(new Set());
        }
    };

    const handleSelectAlert = (alertId: string, checked: boolean) => {
        const newSelected = new Set(selectedAlerts);
        if (checked) {
            newSelected.add(alertId);
        } else {
            newSelected.delete(alertId);
        }
        setSelectedAlerts(newSelected);
    };

    const handleBulkAction = (action: 'resolved' | 'investigating' | 'false_positive' | 'delete') => {
        setBulkActionDialog({ open: true, action });
    };

    const confirmBulkAction = async () => {
        const alertIds = Array.from(selectedAlerts);

        try {
            if (bulkActionDialog.action === 'delete') {
                await api.patch('/alerts/bulk-update', { alertIds, action: 'delete' });
                toast.success(`Deleted ${alertIds.length} alerts`);
            } else {
                await api.patch('/alerts/bulk-update', { alertIds, status: bulkActionDialog.action });
                toast.success(`Updated ${alertIds.length} alerts to ${bulkActionDialog.action}`);
            }

            setSelectedAlerts(new Set());
            refetch();
        } catch (error) {
            toast.error('Failed to perform bulk action');
        }

        setBulkActionDialog({ ...bulkActionDialog, open: false });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Alerts Management</h1>
                <div className="flex gap-2">
                    {selectedAlerts.size > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" size="sm">
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Bulk Actions ({selectedAlerts.size})
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleBulkAction('resolved')}>
                                    Mark as Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkAction('investigating')}>
                                    Mark as Investigating
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkAction('false_positive')}>
                                    Mark as False Positive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('delete')}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
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
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={filteredAlerts.length > 0 && selectedAlerts.size === filteredAlerts.length}
                                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        />
                                    </TableHead>
                                    <TableHead>Rule Name</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Summary</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAlerts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            No alerts found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAlerts.map((alert) => (
                                        <TableRow
                                            key={alert._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={(e) => {
                                                // Don't navigate if clicking checkbox or assignment
                                                if ((e.target as HTMLElement).closest('[role="checkbox"]') ||
                                                    (e.target as HTMLElement).closest('[role="combobox"]')) return;
                                                router.push(`/dashboard/alerts/${alert._id}`);
                                            }}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedAlerts.has(alert._id)}
                                                    onCheckedChange={(checked) => handleSelectAlert(alert._id, checked as boolean)}
                                                />
                                            </TableCell>
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
                                            <TableCell>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <AssignUserSelect
                                                        value={(alert.assignedTo as any)?._id || (typeof alert.assignedTo === 'string' ? alert.assignedTo : undefined)}
                                                        onSelect={async (userId) => {
                                                            try {
                                                                await api.patch(`/alerts/${alert._id}/assign`, { userId });
                                                                toast.success('Alert assigned successfully');
                                                                // Optimistic update or refetch
                                                                refetch();
                                                            } catch (error) {
                                                                toast.error('Failed to assign alert');
                                                            }
                                                        }}
                                                    />
                                                </div>
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

            <BulkActionDialog
                open={bulkActionDialog.open}
                onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}
                action={bulkActionDialog.action}
                count={selectedAlerts.size}
                onConfirm={confirmBulkAction}
            />
        </div>
    );
}

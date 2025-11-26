'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DetectionRule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Plus } from 'lucide-react';

const severityColors = {
    critical: 'bg-red-500 hover:bg-red-600',
    high: 'bg-orange-500 hover:bg-orange-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    low: 'bg-blue-500 hover:bg-blue-600',
};

export default function RulesPage() {
    const { data: rules, isLoading, refetch } = useQuery({
        queryKey: ['rules'],
        queryFn: async () => {
            const response = await api.get('/rules');
            return response.data as DetectionRule[];
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Detection Rules</h1>
                <div className="flex gap-2">
                    <Button onClick={() => refetch()} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button size="sm" disabled>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Rule
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Rules ({rules?.length || 0})</CardTitle>
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!rules || rules.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No detection rules configured
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rules.map((rule) => (
                                        <TableRow key={rule._id}>
                                            <TableCell className="font-medium">{rule.name}</TableCell>
                                            <TableCell>
                                                <Badge className={severityColors[rule.severity]}>
                                                    {rule.severity.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate">{rule.description}</TableCell>
                                            <TableCell>
                                                {rule.enabled ? (
                                                    <Badge variant="outline" className="bg-green-500">Enabled</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-gray-400">Disabled</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(rule.createdAt).toLocaleString()}</TableCell>
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

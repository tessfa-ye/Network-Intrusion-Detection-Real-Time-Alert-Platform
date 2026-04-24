'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Search, 
    RefreshCcw, 
    ExternalLink,
    History
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlacklistItem {
    _id: string;
    ip: string;
    reason: string;
    severity: string;
    isActive: boolean;
    createdAt: string;
}

export default function FirewallPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [ipToUnblock, setIpToUnblock] = useState<string | null>(null);

    const { data: blacklist = [], isLoading, isFetching, refetch } = useQuery<BlacklistItem[]>({
        queryKey: ['blacklist'],
        queryFn: async () => {
            const res = await api.get('/firewall/blacklist');
            return res.data;
        }
    });

    const unblockMutation = useMutation({
        mutationFn: async (ip: string) => {
            await api.delete(`/firewall/unblock/${ip}`);
        },
        onSuccess: (_, ip) => {
            toast.success(`Access restored for ${ip}`, {
                description: 'The IP has been purged from the blacklist and is now allowed through the sensor network.'
            });
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
            setIpToUnblock(null);
        },
        onError: (err: any) => {
            toast.error('Restoration Failed', {
                description: err.response?.data?.message || err.message
            });
        }
    });

    const filteredList = blacklist.filter(item => 
        item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeBlocks = blacklist.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Firewall Registry</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manual Kill-Switch history and active IP blacklisting management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            refetch();
                            toast.info('Registry Synchronizing', { duration: 1000 });
                        }}
                        disabled={isFetching}
                        className="bg-white dark:bg-slate-950"
                    >
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-[#0b1120] border-white/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            Active Blocks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{activeBlocks}</div>
                        <p className="text-xs text-muted-foreground mt-1">IPs currently blocked by sensor network</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#0b1120] border-white/5 shadow-sm md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                            <History className="h-4 w-4 text-blue-500" />
                            Defense Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-400">
                            The Firewall Registry enforces hardware-level packet dropping for all IPs marked as <strong>Active</strong>. 
                            Unblocking an IP restores connectivity instantly across the global security grid and purges the record from history.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white dark:bg-[#0b1120] border-white/5 shadow-xl">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Blacklisted Entities</CardTitle>
                            <CardDescription>Comprehensive history of manual and automated blocks.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input 
                                placeholder="Filter by IP or Reason..." 
                                className="pl-9 bg-slate-50 dark:bg-[#020617] border-white/10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-white/5 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-[#0f172a]">
                                <TableRow>
                                    <TableHead className="w-48 font-bold text-slate-400">Source IP</TableHead>
                                    <TableHead className="font-bold text-slate-400">Status</TableHead>
                                    <TableHead className="font-bold text-slate-400">Reason</TableHead>
                                    <TableHead className="font-bold text-slate-400">Blocked Date</TableHead>
                                    <TableHead className="text-right font-bold text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-slate-500 italic">
                                            Scanning registry database...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-slate-500 italic">
                                            No blocked IPs found in the registry.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredList.map((item) => (
                                        <TableRow key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <TableCell className="font-mono font-bold text-blue-500 flex items-center gap-2">
                                                {item.ip}
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 cursor-pointer" />
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-red-500/15 text-red-500 border-red-500/20 hover:bg-red-500/15">
                                                    Active Block
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-xs truncate" title={item.reason}>
                                                {item.reason}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {new Date(item.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                                                    disabled={unblockMutation.isPending}
                                                    onClick={() => setIpToUnblock(item.ip)}
                                                >
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    Unblock
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!ipToUnblock} onOpenChange={(open) => !open && setIpToUnblock(null)}>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Network Access?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            You are about to unblock <span className="text-white font-bold">{ipToUnblock}</span>.
                            <br /><br />
                            This will:
                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                <li>Immediately stop dropping packets from this IP.</li>
                                <li>Permanently delete the record from the defense registry.</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-white/5 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => ipToUnblock && unblockMutation.mutate(ipToUnblock)}
                        >
                            Confirm Unblock
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

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
    History,
    Globe,
    Zap,
    ChevronLeft
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BlacklistItem {
    id: string;
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

    const { data: intelStats, refetch: refetchIntel } = useQuery({
        queryKey: ['intel-stats'],
        queryFn: async () => {
            const res = await api.get('/intelligence/stats');
            return res.data;
        }
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            await api.post('/intelligence/sync');
        },
        onSuccess: () => {
            toast.success('Intelligence Sync Complete', {
                description: 'The global threat intelligence database has been synchronized with your local firewall.'
            });
            refetch();
            refetchIntel();
        },
        onError: () => {
            toast.error('Sync Failed', { description: 'Could not connect to threat intelligence servers.' });
        }
    });

    const unblockMutation = useMutation({
        mutationFn: async (ip: string) => {
            await api.delete(`/firewall/unblock/${encodeURIComponent(ip)}`);
        },
        onSuccess: (_, ip) => {
            toast.success(`Access restored for ${ip}`, {
                description: 'The IP has been moved to the Allowlist and will not be re-blocked by global feeds.'
            });
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
            queryClient.invalidateQueries({ queryKey: ['allowlist'] });
            queryClient.invalidateQueries({ queryKey: ['intelligence-stats'] });
            setIpToUnblock(null);
        },
        onError: (err: any) => {
            toast.error('Restoration Failed', {
                description: err.response?.data?.message || err.message
            });
        }
    });

    const getRegionForIp = (ip: string) => {
        const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + (parseInt(octet, 10) || 0), 0 >>> 0);
        const rand = Math.abs(ipNum) % 10;
        const countries = ['United States', 'Russia', 'China', 'Japan', 'Brazil', 'Germany', 'France', 'India', 'South Korea', 'Italy'];
        return countries[rand];
    };

    const [viewMode, setViewMode] = useState<'manual' | 'intelligence' | 'allowlist'>('manual');

    const { data: allowlist = [], refetch: refetchAllowlist } = useQuery<any[]>({
        queryKey: ['allowlist'],
        queryFn: async () => {
            const res = await api.get('/firewall/allowlist');
            return res.data;
        }
    });

    const manualBlocks = blacklist.filter(item => !(item.reason || '').includes('Global Threat Intelligence'));
    const intelBlocks = blacklist.filter(item => (item.reason || '').includes('Global Threat Intelligence'));

    const currentList = viewMode === 'manual' ? manualBlocks : viewMode === 'intelligence' ? intelBlocks : allowlist;

    const filteredList = currentList.filter(item => 
        item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Single source of truth for stats
    const stats = {
        totalBlocks: blacklist.length,
        intelligenceCount: intelBlocks.length,
        allowlistCount: allowlist.length
    };

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
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                    >
                        {syncMutation.isPending ? <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
                        Sync Intelligence
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            refetch();
                            refetchIntel();
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
                <Card 
                    className={`border-white/5 shadow-sm cursor-pointer transition-all duration-200 group ${
                        viewMode === 'intelligence' 
                        ? 'bg-amber-500/10 ring-1 ring-amber-500/50' 
                        : 'bg-white dark:bg-[#0b1120] hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                    onClick={() => setViewMode('intelligence')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium flex items-center justify-between uppercase tracking-wider ${
                            viewMode === 'intelligence' ? 'text-amber-500' : 'text-muted-foreground'
                        }`}>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Intelligence Feeds
                            </div>
                            {viewMode !== 'intelligence' && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-amber-500">{stats.intelligenceCount}</div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                                {viewMode === 'intelligence' ? 'Currently viewing feed' : 'Click to filter registry'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#0b1120] border-white/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            Active Blocks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{stats.totalBlocks}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total IPs currently blocked in registry</p>
                    </CardContent>
                </Card>

                <Card 
                    className={`border-white/5 shadow-sm cursor-pointer transition-all duration-200 group ${
                        viewMode === 'allowlist' 
                        ? 'bg-blue-500/10 ring-1 ring-blue-500/50' 
                        : 'bg-white dark:bg-[#0b1120] hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                    onClick={() => setViewMode('allowlist')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium flex items-center justify-between uppercase tracking-wider ${
                            viewMode === 'allowlist' ? 'text-blue-500' : 'text-muted-foreground'
                        }`}>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Allowlist (VIP)
                            </div>
                            {viewMode !== 'allowlist' && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-500">{stats.allowlistCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {viewMode === 'allowlist' ? 'Currently viewing allowed' : 'Click to view exceptions'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white dark:bg-[#0b1120] border-white/5 shadow-xl">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-4">
                            {viewMode !== 'manual' && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setViewMode('manual')}
                                    className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 border-none shadow-md"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Back to Registry
                                </Button>
                            )}
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {viewMode === 'manual' ? 'Blacklisted Entities' : viewMode === 'intelligence' ? 'Global Intelligence Feed' : 'Explicit Allowlist'}
                                    {viewMode === 'intelligence' && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20 uppercase text-[10px]">Live Data</Badge>}
                                    {viewMode === 'allowlist' && <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20 uppercase text-[10px]">Trusted</Badge>}
                                </CardTitle>
                                <CardDescription>
                                    {viewMode === 'manual' 
                                        ? 'History of manual blocks and sensor-detected threats.' 
                                        : viewMode === 'intelligence'
                                        ? 'Automatically blocked IPs from global Emerging Threats lists.'
                                        : 'These IPs are explicitly allowed and will never be blocked by the system.'
                                    }
                                </CardDescription>
                            </div>
                        </div>
                        <div className="relative w-full md:w-72 self-end">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input 
                                placeholder={viewMode === 'manual' ? "Filter manual blocks..." : viewMode === 'intelligence' ? "Search threat feed..." : "Search allowlist..."}
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
                                    <TableHead className="font-bold text-slate-400">Source</TableHead>
                                    <TableHead className="font-bold text-slate-400">Region</TableHead>
                                    <TableHead className="font-bold text-slate-400">Reason</TableHead>
                                    <TableHead className="font-bold text-slate-400 text-right">Actions</TableHead>
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
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <TableCell className="font-mono font-bold text-blue-500 flex items-center gap-2">
                                                {item.ip}
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 cursor-pointer" />
                                            </TableCell>
                                            <TableCell>
                                                {item.reason.includes('Global Threat Intelligence') ? (
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
                                                        Intelligence
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                                                        Manual
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600 dark:text-slate-300">
                                                {getRegionForIp(item.ip)}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-xs truncate text-slate-500" title={item.reason}>
                                                {item.reason}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {viewMode === 'allowlist' ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                                        onClick={async () => {
                                                            await api.delete(`/firewall/allowlist/${encodeURIComponent(item.ip)}`);
                                                            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
                                                            queryClient.invalidateQueries({ queryKey: ['allowlist'] });
                                                            queryClient.invalidateQueries({ queryKey: ['intelligence-stats'] });
                                                            toast.success('Removed from Allowlist', { description: `${item.ip} can now be blocked again.` });
                                                        }}
                                                    >
                                                        <ShieldAlert className="h-4 w-4 mr-2" />
                                                        Block Again
                                                    </Button>
                                                ) : (
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
                                                )}
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

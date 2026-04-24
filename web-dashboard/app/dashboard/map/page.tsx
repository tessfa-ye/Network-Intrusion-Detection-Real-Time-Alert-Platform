'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Globe, ShieldAlert, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { ForensicTimeline } from '@/components/dashboard/forensic-timeline';
import { ReputationIntelligence } from '@/components/dashboard/reputation-intelligence';
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

const ThreatMap = dynamic(() => import('@/components/dashboard/threat-map').then(mod => mod.ThreatMap), {
    loading: () => <div className="h-[600px] w-full animate-pulse rounded-xl bg-muted" />,
    ssr: false
});

interface AlertData {
    _id: string;
    severity: string;
    summary: string;
    ruleName: string;
    location?: {
        lat: number;
        lon: number;
        city: string;
        country: string;
    };
    createdAt: string;
}

export default function MapPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [selectedThreat, setSelectedThreat] = useState<any>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [ipToBlock, setIpToBlock] = useState<string | null>(null);

    const { data: alertsData } = useQuery({
        queryKey: ['map-alerts'],
        queryFn: async () => {
            const response = await api.get('/alerts?limit=100');
            return response.data as AlertData[];
        },
    });

    // Check blacklist to see if threats are already neutralized
    const { data: blacklist = [] } = useQuery({
        queryKey: ['firewall-blacklist'],
        queryFn: async () => {
            const response = await api.get('/firewall/blacklist');
            return response.data;
        },
    });

    useEffect(() => {
        if (alertsData) setAlerts(alertsData);
    }, [alertsData]);

    useEffect(() => {
        const socket = getSocket();
        const token = localStorage.getItem('accessToken');

        if (token && socket) {
            socket.auth = { token };
            socket.connect();
            socket.emit('subscribe:alerts');

            socket.on('alert:new', (newAlert: AlertData) => {
                setAlerts(prev => [newAlert, ...prev].slice(0, 100));
            });

            return () => {
                socket.off('alert:new');
            };
        }
    }, []);

    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const getCountryName = (code: string) => {
        try {
            return regionNames.of(code) || code;
        } catch (e) {
            return code;
        }
    };

    const threatPoints = alerts
        .filter(a => a.location?.lat && a.location?.lon)
        .map(a => ({
            id: a._id,
            lat: a.location!.lat,
            lon: a.location!.lon,
            severity: a.severity,
            city: a.location?.city,
            country: a.location?.country ? getCountryName(a.location.country) : 'Unknown',
            sourceIP: (a as any).affectedAssets?.[0] || 'Unknown IP'
        }));

    const sourceRegions = alerts.reduce((acc, alert) => {
        const country = alert.location?.country ? getCountryName(alert.location.country) : 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleBlockIp = async (ip: string) => {
        setIsBlocking(true);
        const toastId = toast.loading(`Initiating Kill Switch for ${ip}...`);

        try {
            await api.post('/firewall/block', {
                ip,
                reason: 'Manual kill-switch from Geo-Map interface',
                severity: 'critical'
            });

            toast.success(`IP ${ip} blacklisted`, {
                id: toastId,
                description: 'The sensor network is now dropping all packets from this source.',
            });
            
            // Instantly refresh the blacklist state so the button changes
            queryClient.invalidateQueries({ queryKey: ['firewall-blacklist'] });
            
            // Keep the panel open so user sees the "Already Blocked" state transition!
            setIpToBlock(null);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Internal Error';
            toast.error('Kill Switch Failed', {
                id: toastId,
                description: errorMsg
            });
        } finally {
            setIsBlocking(false);
        }
    };

    const activeThreatsCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

    const topRegions = Object.entries(sourceRegions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Geographic Threat Intelligence</h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Visualization of global network anomalies
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white dark:bg-[#0b1120] rounded-xl border border-white/10 shadow-sm flex items-center gap-3">
                        <ShieldAlert className="text-red-500 h-5 w-5" />
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Active Threats</div>
                            <div className="text-lg font-bold">{activeThreatsCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <Card className="xl:col-span-3 bg-[#0b1120] border-white/5 overflow-hidden shadow-2xl relative min-h-[500px] lg:min-h-[650px]">
                    <CardContent className="p-0 h-full w-full absolute inset-0">
                        <ThreatMap
                            threats={threatPoints}
                            onSelect={setSelectedThreat}
                            onDeselect={() => setSelectedThreat(null)}
                        />
                    </CardContent>

                    {selectedThreat && (
                        <div className="absolute top-10 md:top-15 right-4 md:right-6 z-30 w-80 md:w-96 h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-2xl p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-right-4 duration-300 flex flex-col overflow-hidden">
                            {/* Header - Fixed */}
                            <div className="flex justify-between items-start mb-4 shrink-0 border-b border-slate-100 dark:border-white/5 pb-3">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4 text-red-500" />
                                        Threat Intelligence
                                    </h3>
                                    <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">{selectedThreat.sourceIP}</div>
                                </div>
                                <button onClick={() => setSelectedThreat(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 p-1 rounded-full">✕</button>
                            </div>

                            {/* Content Wrapper */}
                            <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-hidden">
                                {/* Stats - Fixed */}
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 shrink-0">
                                    <div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-tight">Location</div>
                                        <div className="text-sm text-slate-900 dark:text-white font-semibold truncate text-ellipsis overflow-hidden">
                                            {selectedThreat.city}, {selectedThreat.country}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-tight">Severity</div>
                                        <div className={`text-sm font-bold uppercase tracking-tighter ${selectedThreat.severity === 'critical' ? 'text-red-500' :
                                            selectedThreat.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                                            }`}>
                                            {selectedThreat.severity}
                                        </div>
                                    </div>
                                </div>

                                {/* Global Recon / Reputation */}
                                <div className="shrink-0">
                                    <ReputationIntelligence sourceIP={selectedThreat.sourceIP} />
                                </div>

                                {/* Forensic Timeline - Forced Scrollable */}
                                <div className="flex-1 min-h-0 overflow-hidden relative">
                                    <ForensicTimeline sourceIP={selectedThreat.sourceIP} />
                                </div>

                                {/* Footer Action - Fixed */}
                                <div className="pt-3 border-t border-slate-100 dark:border-white/5 shrink-0 mt-auto">
                                    {blacklist?.some((b: any) => b.ip === selectedThreat.sourceIP) ? (
                                        <Button
                                            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold py-5 rounded-xl uppercase tracking-widest text-xs"
                                            onClick={() => router.push('/dashboard/firewall')}
                                        >
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                            Already Blocked - Manage
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-xl shadow-lg shadow-red-900/20 group uppercase tracking-widest text-xs"
                                            disabled={isBlocking}
                                            onClick={() => setIpToBlock(selectedThreat.sourceIP)}
                                        >
                                            <ShieldAlert className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                                            Activate Kill Switch
                                        </Button>
                                    )}
                                    <p className="mt-2 text-[10px] text-center text-slate-400 italic font-medium uppercase tracking-tighter leading-tight px-2">
                                        {blacklist?.some((b: any) => b.ip === selectedThreat.sourceIP) 
                                            ? "This source is already neutralized by the firewall." 
                                            : "Note: Disconnects all traffic from this source."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 sm:rounded-full">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Critical</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">High</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tighter">Suspicious</span>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-white dark:bg-[#0b1120] border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Top Source Regions
                            </h2>
                            <div className="px-2 py-0.5 bg-blue-500/10 rounded-full text-[10px] font-bold text-blue-500 uppercase border border-blue-500/20">
                                Live
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {topRegions.map(([country, count]) => (
                                    <div key={country} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                {count}
                                            </div>
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{country}</span>
                                        </div>
                                        <div className="h-1.5 w-16 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${(count / (alerts.length || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!ipToBlock} onOpenChange={(open) => !open && setIpToBlock(null)}>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                            <ShieldAlert className="h-6 w-6" />
                            Confirm Kill Switch Activation
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to DISCONNECT all traffic from <span className="text-white font-mono font-bold font-lg underline decoration-red-500 underline-offset-4">{ipToBlock}</span>?
                            <br /><br />
                            This will activate the hardware-level defense policy and immediately block all incoming requests from this source. This action can be reversed in the Firewall Registry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-white/5 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => ipToBlock && handleBlockIp(ipToBlock)}
                        >
                            Execute Block
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { Globe, ShieldAlert, Activity, Crosshair } from 'lucide-react';

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
    const [alerts, setAlerts] = useState<AlertData[]>([]);

    const { data: alertsData, isLoading } = useQuery({
        queryKey: ['map-alerts'],
        queryFn: async () => {
            const response = await api.get('/alerts?limit=100'); // Get more for the map
            return response.data as AlertData[];
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

    // Aggregate Top Source Regions
    const sourceRegions = alerts.reduce((acc, alert) => {
        const country = alert.location?.country ? getCountryName(alert.location.country) : 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const [selectedThreat, setSelectedThreat] = useState<any>(null);
    const [isBlocking, setIsBlocking] = useState(false);

    const handleBlockIp = async (ip: string) => {
        if (!confirm(`Are you sure you want to DISCONNECT all traffic from ${ip}? This will activate the hardware-level Kill Switch.`)) return;
        
        setIsBlocking(true);
        try {
            await api.post('/firewall/block', {
                ip,
                reason: 'Manual kill-switch from Geo-Map interface',
                severity: 'critical'
            });
            alert(`IP ${ip} has been successfully blacklisted in the sensor network.`);
            setSelectedThreat(null);
        } catch (err: any) {
            console.error('FAILED TO EXECUTE KILL SWITCH:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Internal Error';
            alert(`Failed to execute Kill Switch: ${errorMsg}`);
        } finally {
            setIsBlocking(false);
        }
    };

    const activeThreats = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

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
                            <div className="text-lg font-bold">{activeThreats}</div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <Card className="xl:col-span-3 bg-[#0b1120] border-white/5 overflow-hidden shadow-2xl relative min-h-[500px] lg:min-h-[650px]">
                    <CardContent className="p-0 h-full w-full absolute inset-0">
                         <ThreatMap threats={threatPoints} onSelect={setSelectedThreat} />
                    </CardContent>
                    
                    {/* Selected Threat Overlay */}
                    {selectedThreat && (
                        <div className="absolute top-20 right-6 z-30 w-72 bg-[#0b1120]/90 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-right-4 duration-300">
                             <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Threat Detail</h3>
                                <button onClick={() => setSelectedThreat(null)} className="text-slate-400 hover:text-white">✕</button>
                             </div>
                             <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Source IP</div>
                                    <div className="text-lg font-mono font-bold text-blue-400">{selectedThreat.sourceIP}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Location</div>
                                    <div className="text-sm">{selectedThreat.city}, {selectedThreat.country}</div>
                                </div>
                                <div className="pt-2">
                                    <Button 
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-red-900/20 group"
                                        disabled={isBlocking}
                                        onClick={() => handleBlockIp(selectedThreat.sourceIP)}
                                    >
                                        {isBlocking ? 'Executing...' : (
                                            <>
                                                <ShieldAlert className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                                                ACTIVATE KILL SWITCH
                                            </>
                                        )}
                                    </Button>
                                    <p className="mt-3 text-[10px] text-center text-slate-500 italic uppercase tracking-tighter">
                                        Warn: This will block all incoming traffic from this IP.
                                    </p>
                                </div>
                             </div>
                        </div>
                    )}

                    
                    {/* Floating Legend - Pill Style */}
                    <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 sm:rounded-full">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[10px] font-bold text-red-500 uppercase">Critical</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span className="text-[10px] font-bold text-orange-500 uppercase">High</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                            <span className="text-[10px] font-bold text-yellow-500 uppercase">Medium</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-blue-500 uppercase">Low</span>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-white dark:bg-[#0b1120] border-white/5 shadow-xl h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">Top source regions</CardTitle>
                            <p className="text-xs text-muted-foreground transition-all">Tracking {Object.keys(sourceRegions).length} countries</p>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto max-h-[400px] xl:max-h-none">
                            <div className="space-y-6">
                                {topRegions.map(([country, count]) => (
                                    <div key={country} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-3 text-sm font-medium">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {country}
                                        </div>
                                        <span className="text-sm font-bold font-mono">{count}</span>
                                    </div>
                                ))}
                                {topRegions.length === 0 && (
                                    <div className="text-xs text-slate-500 italic text-center py-4">Scanning for active regions...</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

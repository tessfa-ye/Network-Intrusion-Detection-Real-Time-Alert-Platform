'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Globe, Shield, AlertTriangle, Building2, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ReputationData {
    ip: string;
    reputation: {
        confidenceScore: number;
        isp: string;
        usageType: string;
        threatTags: string[];
        lastReported: string | null;
        totalReports: number;
    }
}

interface ReputationIntelligenceProps {
    sourceIP: string;
}

export function ReputationIntelligence({ sourceIP }: ReputationIntelligenceProps) {
    const { data, isLoading } = useQuery<ReputationData>({
        queryKey: ['reputation', sourceIP],
        queryFn: async () => {
            const res = await api.get(`/analysis/reputation/${sourceIP}`);
            return res.data;
        },
        enabled: !!sourceIP,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-4 space-y-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Querying Global Intel...</p>
            </div>
        );
    }

    if (!data || !data.reputation) return null;

    const { reputation } = data;
    const isMalicious = reputation.confidenceScore > 50;
    
    return (
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Global Recon
                </h4>
                {reputation.lastReported && (
                    <span className="text-[9px] text-slate-400 font-mono">
                        Last seen: {new Date(reputation.lastReported).toLocaleDateString()}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Malicious Confidence</span>
                        <span className={`font-bold ${
                            isMalicious ? 'text-red-500' : 'text-green-500'
                        }`}>{reputation.confidenceScore}%</span>
                    </div>
                    <Progress 
                        value={reputation.confidenceScore} 
                        className={`h-1.5 ${isMalicious ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Provider
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {reputation.isp}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            Allocation
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {reputation.usageType}
                        </div>
                    </div>
                </div>

                {reputation.threatTags.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                        {reputation.threatTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[9px] uppercase px-1.5 h-4 bg-red-500/10 text-red-500 border-red-500/20">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

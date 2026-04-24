'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, AlertCircle, Clock, Zap, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ForensicEvent {
    _id: string;
    eventType: string;
    severity: string;
    summary: string;
    timestamp: string;
    details?: any;
}

interface ForensicTimelineProps {
    sourceIP: string;
}

export function ForensicTimeline({ sourceIP }: ForensicTimelineProps) {
    const { data: events, isLoading } = useQuery<ForensicEvent[]>({
        queryKey: ['forensic', sourceIP],
        queryFn: async () => {
            const res = await api.get(`/events?sourceIP=${sourceIP}&limit=20`);
            return res.data;
        },
        enabled: !!sourceIP,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Reconstructing Trace...</p>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 italic text-sm">
                No recent activity logs found for this IP.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 shrink-0">
                <Clock className="h-3 w-3" />
                Forensic Trace
            </h4>
            
            <ScrollArea className="flex-1 pr-4 min-h-0">
                <div className="relative ml-2 border-l border-slate-200 dark:border-slate-800 space-y-6 pb-4">
                    {events.map((event, idx) => (
                        <div key={event._id} className="relative pl-6 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Timeline Node */}
                            <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0b1120] ${
                                event.severity === 'critical' ? 'bg-red-500' :
                                event.severity === 'high' ? 'bg-orange-500' :
                                'bg-blue-500'
                            }`} />
                            
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[10px] font-mono text-slate-500">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                    <Badge variant="outline" className={`text-[9px] uppercase h-4 px-1.5 ${
                                        event.severity === 'critical' ? 'text-red-500 border-red-500/20' :
                                        event.severity === 'high' ? 'text-orange-500 border-orange-500/20' :
                                        'text-blue-500 border-blue-500/20'
                                    }`}>
                                        {event.eventType}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-900 dark:text-slate-300 font-medium leading-tight">
                                    {event.summary}
                                </p>
                                {event.details?.reason && (
                                    <div className="text-[10px] text-slate-500 italic bg-slate-50 dark:bg-white/5 p-1.5 rounded mt-1 border border-black/5 dark:border-white/5">
                                        Reason: {event.details.reason}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

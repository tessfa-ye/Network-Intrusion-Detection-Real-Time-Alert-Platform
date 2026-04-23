'use client';

import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { Terminal } from 'lucide-react';
import { useTheme } from 'next-themes';

interface LogEntry {
    timestamp: string;
    type: string;
    source: string;
    message: string;
    severity: string;
}

export function LiveEventFeed() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const socket = getSocket();
        
        const handleNewEvent = (event: any) => {
            const newLog: LogEntry = {
                timestamp: new Date(event.timestamp).toLocaleTimeString(),
                type: event.eventType,
                source: event.sourceIP,
                message: event.description,
                severity: event.severity,
            };
            
            setLogs(prev => [newLog, ...prev].slice(0, 50));
        };

        socket.on('event:new', handleNewEvent);
        
        return () => {
            socket.off('event:new');
        };
    }, []);

    const isDark = resolvedTheme === 'dark';

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return isDark ? 'text-red-400' : 'text-red-600';
            case 'high': return isDark ? 'text-orange-400' : 'text-orange-600';
            case 'medium': return isDark ? 'text-yellow-400' : 'text-yellow-600';
            default: return isDark ? 'text-green-400' : 'text-green-600';
        }
    };

    if (!mounted) return <div className="h-full w-full animate-pulse rounded-xl bg-muted" />;

    return (
        <div className={`flex flex-col h-full rounded-xl border overflow-hidden font-mono text-[10px] shadow-2xl transition-colors duration-500 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}>
            <div className={`flex items-center gap-2 px-4 py-2 border-b transition-colors duration-500 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
                <Terminal className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className="uppercase tracking-widest font-bold">Live Traffic Stream</span>
                <div className="ml-auto flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>
            
            <div 
                ref={scrollRef}
                className={`flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide transition-colors duration-500 ${
                    isDark ? 'bg-black/40' : 'bg-slate-50'
                }`}
            >
                {logs.length === 0 && (
                    <div className={`italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Awaiting connection to sensor network...</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 transition-colors py-0.5 px-2 rounded animate-in fade-in slide-in-from-left-1 duration-300 ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}>
                        <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} shrink-0`}>[{log.timestamp}]</span>
                        <span className={`font-bold shrink-0 uppercase w-16 ${getSeverityColor(log.severity)}`}>
                            {log.type}
                        </span>
                        <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} shrink-0 font-bold`}>{log.source}</span>
                        <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { Terminal } from 'lucide-react';

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

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-400';
            case 'high': return 'text-orange-400';
            case 'medium': return 'text-yellow-400';
            default: return 'text-green-400';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-slate-200 uppercase tracking-widest text-[10px] font-bold">Live Traffic Stream</span>
                <div className="ml-auto flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>
            
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide bg-black/40"
            >
                {logs.length === 0 && (
                    <div className="text-slate-600 italic">Awaiting connection to sensor network...</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 hover:bg-slate-900/50 transition-colors py-0.5 px-1 rounded animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                        <span className={`font-bold shrink-0 uppercase w-16 ${getSeverityColor(log.severity)}`}>
                            {log.type}
                        </span>
                        <span className="text-blue-400 shrink-0">{log.source}</span>
                        <span className="text-slate-300 truncate">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

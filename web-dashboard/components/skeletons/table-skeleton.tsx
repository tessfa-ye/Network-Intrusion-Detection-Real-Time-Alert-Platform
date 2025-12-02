import React from 'react';

export default function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="w-full animate-pulse">
            <div className="flex items-center py-4">
                <div className="h-8 w-64 rounded bg-muted"></div>
                <div className="ml-auto h-8 w-24 rounded bg-muted"></div>
            </div>
            <div className="rounded-md border">
                <div className="h-12 border-b bg-muted/50"></div>
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 border-b last:border-0">
                        {[...Array(columns)].map((_, j) => (
                            <div key={j} className="h-4 rounded bg-muted mr-4 last:mr-0" style={{ width: `${100 / columns}%` }}></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

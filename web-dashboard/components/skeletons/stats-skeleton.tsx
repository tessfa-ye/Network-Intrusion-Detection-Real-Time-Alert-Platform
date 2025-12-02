import React from 'react';

export default function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-xl border bg-card text-card-foreground shadow p-6"
                >
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-24 rounded bg-muted"></div>
                        <div className="h-4 w-4 rounded bg-muted"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-8 w-12 rounded bg-muted"></div>
                        <div className="h-3 w-32 rounded bg-muted"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

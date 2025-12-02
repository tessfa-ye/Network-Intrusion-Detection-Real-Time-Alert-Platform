import React from 'react';

export default function CardSkeleton() {
    return (
        <div className="animate-pulse rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="h-4 w-24 rounded bg-muted mb-4"></div>
            <div className="h-32 rounded bg-muted"></div>
        </div>
    );
}

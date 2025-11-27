'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        // Basic client-side protection
        const token = localStorage.getItem('accessToken');
        if (!token && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-white dark:bg-slate-950 md:flex">
                <div className="flex h-14 items-center border-b px-4 font-semibold">
                    NIDAS Platform
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <a href="/dashboard" className="flex items-center gap-3 rounded-lg bg-slate-100 px-3 py-2 text-slate-900 transition-all hover:text-slate-900 dark:bg-slate-800 dark:text-slate-50">
                            Dashboard
                        </a>
                        <a href="/dashboard/alerts" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
                            Alerts
                        </a>
                        <a href="/dashboard/events" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
                            Events
                        </a>
                        <a href="/dashboard/rules" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
                            Rules
                        </a>
                        <a href="/dashboard/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
                            Users
                        </a>
                    </nav>
                </div>
                <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                        <div className="text-sm">
                            <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                            <div className="text-xs text-slate-500">{user?.role}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

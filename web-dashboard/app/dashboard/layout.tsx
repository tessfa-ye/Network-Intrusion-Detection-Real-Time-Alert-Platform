'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, AlertTriangle, ShieldCheck, Settings, Users, LogOut, ChevronLeft, ChevronRight, Globe, Activity, ShieldAlert } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            connectSocket(token);
        }
        return () => {
            disconnectSocket();
        };
    }, [isAuthenticated]);

    const handleLogout = () => {
        logout();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        disconnectSocket();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
        { name: 'Events', href: '/dashboard/events', icon: Activity },
        { name: 'Rules', href: '/dashboard/rules', icon: ShieldCheck },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Firewall', href: '/dashboard/firewall', icon: ShieldAlert },
        { name: 'Geo Map', href: '/dashboard/map', icon: Globe },
    ];

    if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617]">
            {/* Sidebar */}
            <aside
                className={cn(
                    "relative hidden flex-col border-r bg-white dark:bg-[#0b1120] transition-all duration-300 md:flex",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                <div className="flex h-16 items-center justify-between border-b px-4">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            NIDAS
                        </div>
                    )}
                    <div className={cn("flex items-center", isCollapsed && "w-full justify-center")}>
                        {!isCollapsed && <ModeToggle />}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2 h-8 w-8 text-slate-500"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="grid gap-1 px-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group",
                                    pathname === item.href
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-50",
                                    isCollapsed && "justify-center px-0"
                                )}
                                title={isCollapsed ? item.name : ""}
                            >
                                <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-white" : "text-slate-500 dark:text-slate-400")} />
                                {!isCollapsed && <span className="font-medium">{item.name}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="border-t p-4 space-y-4">
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700"></div>
                        {!isCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                <div className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{user?.role}</div>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size={isCollapsed ? "icon" : "sm"}
                        className={cn(
                            "w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10",
                            isCollapsed && "h-10 w-10 mx-auto block"
                        )}
                        onClick={handleLogout}
                    >
                        <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                        {!isCollapsed && "Sign Out"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#020617] scrollbar-thin">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

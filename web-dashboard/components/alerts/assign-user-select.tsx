'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AssignUserSelectProps {
    value?: string;
    onSelect: (userId: string) => void;
    disabled?: boolean;
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export function AssignUserSelect({ value, onSelect, disabled }: AssignUserSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data as User[];
        },
    });

    const selectedUser = users.find((user) => user._id === value);

    const filteredUsers = users.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        const searchTerm = search.toLowerCase();
        return fullName.includes(searchTerm) || email.includes(searchTerm);
    });

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                >
                    {selectedUser ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                    {selectedUser.firstName[0]}
                                    {selectedUser.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                                {selectedUser.firstName} {selectedUser.lastName}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start">
                <div className="p-2">
                    <Input
                        placeholder="Search user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect('');
                            setOpen(false);
                        }}
                        className="cursor-pointer"
                    >
                        <Check
                            className={cn(
                                'mr-2 h-4 w-4',
                                !value ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                        Unassigned
                    </DropdownMenuItem>
                    {filteredUsers.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No user found.
                        </div>
                    )}
                    {filteredUsers.map((user) => {
                        const fullName = `${user.firstName} ${user.lastName}`;
                        return (
                            <DropdownMenuItem
                                key={user._id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(user._id);
                                    setOpen(false);
                                }}
                                className="cursor-pointer"
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        value === user._id ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                            {user.firstName[0]}
                                            {user.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span>{fullName}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

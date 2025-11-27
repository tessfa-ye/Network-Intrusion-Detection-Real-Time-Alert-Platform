'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DetectionRule } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface RuleFormProps {
    rule?: DetectionRule | null;
    onSuccess: () => void;
}

export function RuleForm({ rule, onSuccess }: RuleFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!rule;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            severity: 'medium',
            enabled: true,
        },
    });

    useEffect(() => {
        if (rule) {
            form.reset({
                name: rule.name,
                description: rule.description,
                severity: rule.severity,
                enabled: rule.enabled,
            });
        }
    }, [rule, form]);

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            // Get current user from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const data: any = {
                ...values,
                conditions: [],
                actions: [],
            };

            // Add createdBy only when creating new rule - use 'id' not '_id'
            if (!isEditing && user?.id) {
                data.createdBy = user.id;
            }

            if (isEditing) {
                await api.patch(`/rules/${rule._id}`, data);
            } else {
                await api.post('/rules', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            toast.success(isEditing ? 'Rule updated successfully' : 'Rule created successfully');
            onSuccess();
            form.reset();
        },
        onError: (error: unknown) => {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || 'Failed to save rule');
            } else {
                toast.error('Failed to save rule');
            }
        },
    });

    function onSubmit(values: FormValues) {
        mutation.mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rule Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Suspicious Login Detection" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe what this rule detects..."
                                    {...field}
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enabled</FormLabel>
                                <FormDescription>Rule will actively detect threats</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update Rule' : 'Create Rule'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

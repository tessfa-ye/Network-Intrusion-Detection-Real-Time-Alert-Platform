'use client';

import { useEffect, useState } from 'react';
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
import { ConditionBuilder } from './condition-builder';
import { ConditionPreview } from './condition-preview';
import { RuleConditionGroup } from '@/types/rule-conditions';
import { emptyGroup, validateCondition, convertLegacyConditions } from '@/lib/condition-utils';

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
    const [conditions, setConditions] = useState<RuleConditionGroup>(() => {
        if (rule?.conditions && Array.isArray(rule.conditions) && rule.conditions.length > 0) {
            return convertLegacyConditions(rule.conditions);
        }
        return emptyGroup();
    });

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
            if (rule.conditions && Array.isArray(rule.conditions) && rule.conditions.length > 0) {
                setConditions(convertLegacyConditions(rule.conditions));
            } else {
                setConditions(emptyGroup());
            }
        } else {
            // Reset to empty when no rule (creating new)
            form.reset({
                name: '',
                description: '',
                severity: 'medium',
                enabled: true,
            });
            setConditions(emptyGroup());
        }
    }, [rule?._id, rule?.name, rule?.description, rule?.severity, rule?.enabled, form]);

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            // Get current user from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            // Validate conditions before submitting
            if (!validateCondition(conditions)) {
                toast.error('Please complete all rule conditions');
                throw new Error('Invalid conditions');
            }

            const data: any = {
                ...values,
                conditions: [conditions], // Store as array with our condition tree
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
            console.error('Rule save error:', error);
            if (error instanceof AxiosError) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to save rule';
                toast.error(errorMsg);
                console.error('Backend error response:', error.response?.data);
            } else if (error instanceof Error) {
                if (error.message !== 'Invalid conditions') {
                    toast.error(error.message);
                }
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

                <div className="space-y-4 p-5 border-2 border-dashed rounded-lg bg-muted/30">
                    <div>
                        <FormLabel className="text-base font-semibold">Rule Conditions</FormLabel>
                        <FormDescription className="mb-4 text-sm">
                            Define when this rule should trigger an alert using the visual builder below
                        </FormDescription>
                        <ConditionBuilder value={conditions} onChange={setConditions} />
                    </div>
                    <ConditionPreview condition={conditions} />
                </div>

                <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-5 bg-gradient-to-br from-muted/40 to-muted/20">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base font-semibold">Enabled</FormLabel>
                                <FormDescription>Activate this rule to detect threats in real-time</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onSuccess} className="min-w-[100px]">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending} className="min-w-[140px] font-semibold">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update Rule' : 'Create Rule'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

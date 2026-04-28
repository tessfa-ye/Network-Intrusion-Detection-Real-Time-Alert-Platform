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
import { FlaskConical, Loader2, ShieldCheck, ShieldAlert, Network, BarChart3 } from 'lucide-react';
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
    autoBlock: z.boolean(),
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
            const firstCond = rule.conditions[0];
            // If it's already a group (new format), use it directly
            if (firstCond && typeof firstCond === 'object' && firstCond.type === 'group') {
                return firstCond as RuleConditionGroup;
            }
            return convertLegacyConditions(rule.conditions);
        }
        return emptyGroup();
    });

    // --- Dry Run State ---
    const [dryRunLoading, setDryRunLoading] = useState(false);
    const [dryRunResult, setDryRunResult] = useState<{
        matchedEvents: number;
        totalScanned: number;
        matchRatePercent: number;
        topSourceIPs: { ip: string; count: number }[];
        severityBreakdown: Record<string, number>;
        eventTypeBreakdown: Record<string, number>;
        sampleEvents: any[];
        windowHours: number;
    } | null>(null);

    async function handleDryRun() {
        if (!rule?._id) return;
        setDryRunLoading(true);
        setDryRunResult(null);
        try {
            const res = await api.post(`/rules/${rule._id}/dry-run`);
            setDryRunResult(res.data);
        } catch {
            toast.error('Dry run failed — check the backend logs.');
        } finally {
            setDryRunLoading(false);
        }
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            severity: 'medium',
            enabled: true,
            autoBlock: false,
        },
    });

    useEffect(() => {
        if (rule) {
            form.reset({
                name: rule.name,
                description: rule.description,
                severity: rule.severity,
                enabled: rule.enabled,
                autoBlock: (rule as any).autoBlock || false,
            });
            if (rule.conditions && Array.isArray(rule.conditions) && rule.conditions.length > 0) {
                const firstCond = rule.conditions[0];
                if (firstCond && typeof firstCond === 'object' && firstCond.type === 'group') {
                    setConditions(firstCond as RuleConditionGroup);
                } else {
                    setConditions(convertLegacyConditions(rule.conditions));
                }
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
                autoBlock: false,
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
                toast.error('Please complete all rule conditions with valid values');
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
            if (error instanceof AxiosError) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to save rule';
                toast.error(errorMsg);
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

                <FormField
                    control={form.control}
                    name="autoBlock"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-purple-500/20 p-5 bg-gradient-to-br from-purple-500/5 to-purple-500/10 dark:from-purple-500/10 dark:to-bg-[#020617]">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base font-semibold text-purple-500 flex items-center gap-2">
                                    Autonomous Threat Neutralization (SOAR)
                                </FormLabel>
                                <FormDescription>
                                    Automatically pull the Kill Switch for any IP that triggers this rule.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-purple-600" />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onSuccess} className="min-w-[100px]">
                        Cancel
                    </Button>
                    {isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDryRun}
                            disabled={dryRunLoading}
                            className="min-w-[130px] border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        >
                            {dryRunLoading
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <FlaskConical className="mr-2 h-4 w-4" />}
                            Dry Run
                        </Button>
                    )}
                    <Button type="submit" disabled={mutation.isPending} className="min-w-[140px] font-semibold">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update Rule' : 'Create Rule'}
                    </Button>
                </div>

                {/* Dry Run Results Panel */}
                {dryRunResult && (
                    <div className="rounded-xl border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                            <FlaskConical className="h-5 w-5" />
                            Dry Run Results — Last {dryRunResult.windowHours}h
                        </div>

                        {/* Summary Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-white dark:bg-slate-900 border p-3 text-center shadow-sm">
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{dryRunResult.matchedEvents}</div>
                                <div className="text-xs text-muted-foreground mt-1">Matched Events</div>
                            </div>
                            <div className="rounded-lg bg-white dark:bg-slate-900 border p-3 text-center shadow-sm">
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{dryRunResult.totalScanned}</div>
                                <div className="text-xs text-muted-foreground mt-1">Events Scanned</div>
                            </div>
                            <div className={`rounded-lg border p-3 text-center shadow-sm ${
                                dryRunResult.matchRatePercent > 20
                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200'
                                    : 'bg-green-50 dark:bg-green-950/30 border-green-200'
                            }`}>
                                <div className={`text-2xl font-bold ${
                                    dryRunResult.matchRatePercent > 20 ? 'text-red-600' : 'text-green-600'
                                }`}>{dryRunResult.matchRatePercent}%</div>
                                <div className="text-xs text-muted-foreground mt-1">Match Rate</div>
                            </div>
                        </div>

                        {/* Match rate warning */}
                        {dryRunResult.matchRatePercent > 20 && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200">
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                <span><strong>High noise rule!</strong> This rule would match {dryRunResult.matchRatePercent}% of all traffic — consider tightening conditions to avoid alert fatigue.</span>
                            </div>
                        )}
                        {dryRunResult.matchedEvents === 0 && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border">
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                <span>No events matched in the last {dryRunResult.windowHours}h. Rule conditions may be too strict or no matching traffic exists yet.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* Top Source IPs */}
                            {dryRunResult.topSourceIPs.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                        <Network className="h-3.5 w-3.5" /> Top Source IPs
                                    </div>
                                    <div className="space-y-1.5">
                                        {dryRunResult.topSourceIPs.map(({ ip, count }) => (
                                            <div key={ip} className="flex items-center justify-between text-sm">
                                                <span className="font-mono text-blue-600 dark:text-blue-400">{ip}</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{count} events</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Severity Breakdown */}
                            {Object.keys(dryRunResult.severityBreakdown).length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                        <BarChart3 className="h-3.5 w-3.5" /> Severity Breakdown
                                    </div>
                                    <div className="space-y-1.5">
                                        {Object.entries(dryRunResult.severityBreakdown).map(([sev, count]) => (
                                            <div key={sev} className="flex items-center justify-between text-sm">
                                                <span className={`capitalize font-semibold ${
                                                    sev === 'critical' ? 'text-red-500' :
                                                    sev === 'high' ? 'text-orange-500' :
                                                    sev === 'medium' ? 'text-yellow-500' : 'text-green-500'
                                                }`}>{sev}</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sample Events */}
                        {dryRunResult.sampleEvents.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sample Matched Events</div>
                                <div className="space-y-1 font-mono text-xs">
                                    {dryRunResult.sampleEvents.map((e, i) => (
                                        <div key={i} className="flex gap-2 bg-white dark:bg-slate-900 rounded px-3 py-1.5 border">
                                            <span className="text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</span>
                                            <span className="text-blue-500 font-bold">{e.sourceIP}</span>
                                            <span className="text-purple-500">{e.eventType}</span>
                                            <span className={`font-bold ${
                                                e.severity === 'critical' ? 'text-red-500' :
                                                e.severity === 'high' ? 'text-orange-500' :
                                                e.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                                            }`}>{e.severity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </Form>
    );
}

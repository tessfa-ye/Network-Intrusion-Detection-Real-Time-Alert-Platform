'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RuleConditionGroup, RuleCondition, LogicalOperator } from '@/types/rule-conditions';
import { emptyCondition, emptyGroup } from '@/lib/condition-utils';
import { ConditionItem } from './condition-item';

interface ConditionGroupProps {
    group: RuleConditionGroup;
    onChange: (group: RuleConditionGroup) => void;
    onDelete?: () => void;
    isRoot?: boolean;
}

export function ConditionGroup({ group, onChange, onDelete, isRoot = false }: ConditionGroupProps) {
    const handleOperatorChange = (operator: LogicalOperator) => {
        onChange({ ...group, operator });
    };

    const handleConditionChange = (index: number, newCondition: RuleCondition) => {
        const newConditions = [...group.conditions];
        newConditions[index] = newCondition;
        onChange({ ...group, conditions: newConditions });
    };

    const handleAddCondition = () => {
        onChange({
            ...group,
            conditions: [...group.conditions, emptyCondition()],
        });
    };

    const handleAddGroup = () => {
        onChange({
            ...group,
            conditions: [...group.conditions, emptyGroup()],
        });
    };

    const handleDeleteCondition = (index: number) => {
        // Don't allow deleting if it's the last condition
        if (group.conditions.length <= 1 && isRoot) return;

        const newConditions = group.conditions.filter((_, i) => i !== index);
        onChange({ ...group, conditions: newConditions });
    };

    return (
        <div className={`space-y-3 ${!isRoot ? 'p-4 border-2 border-dashed rounded-lg' : ''}`}>
            {/* Group Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!isRoot && <Badge variant="outline">Group</Badge>}
                    <Select value={group.operator} onValueChange={handleOperatorChange}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddCondition}>
                        <Plus className="mr-1 h-3 w-3" />
                        Condition
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddGroup}>
                        <Plus className="mr-1 h-3 w-3" />
                        Group
                    </Button>
                    {!isRoot && onDelete && (
                        <Button variant="ghost" size="sm" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
                {group.conditions.map((condition, index) => (
                    <div key={condition.id}>
                        {index > 0 && (
                            <div className="flex items-center justify-center py-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {group.operator}
                                </Badge>
                            </div>
                        )}
                        {condition.type === 'condition' ? (
                            <ConditionItem
                                condition={condition}
                                onChange={(newCondition) => handleConditionChange(index, newCondition)}
                                onDelete={() => handleDeleteCondition(index)}
                                showDelete={group.conditions.length > 1 || !isRoot}
                            />
                        ) : (
                            <ConditionGroup
                                group={condition}
                                onChange={(newGroup) => handleConditionChange(index, newGroup)}
                                onDelete={() => handleDeleteCondition(index)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

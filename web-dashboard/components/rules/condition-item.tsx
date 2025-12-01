'use client';

import * as React from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    RuleConditionItem,
    ConditionField,
    ComparisonOperator,
    FIELD_METADATA,
    OPERATOR_LABELS,
    VALID_OPERATORS,
} from '@/types/rule-conditions';

interface ConditionItemProps {
    condition: RuleConditionItem;
    onChange: (condition: RuleConditionItem) => void;
    onDelete: () => void;
    showDelete?: boolean;
}

export function ConditionItem({ condition, onChange, onDelete, showDelete = true }: ConditionItemProps) {
    const fieldMetadata = FIELD_METADATA[condition.field];
    const validOperators = VALID_OPERATORS[fieldMetadata.type];

    const handleFieldChange = (field: ConditionField) => {
        const newFieldMetadata = FIELD_METADATA[field];
        const newValidOperators = VALID_OPERATORS[newFieldMetadata.type];

        // Reset operator if current one isn't valid for new field
        const newOperator = newValidOperators.includes(condition.operator)
            ? condition.operator
            : newValidOperators[0];

        onChange({
            ...condition,
            field,
            operator: newOperator,
            value: '',
        });
    };

    const handleOperatorChange = (operator: ComparisonOperator) => {
        // Reset value when changing to/from list operators
        const isListOperator = operator === 'in' || operator === 'not_in';
        const wasListOperator = condition.operator === 'in' || condition.operator === 'not_in';

        onChange({
            ...condition,
            operator,
            value: isListOperator !== wasListOperator ? (isListOperator ? [] : '') : condition.value,
        });
    };

    const handleValueChange = (value: string | number | string[]) => {
        onChange({
            ...condition,
            value,
        });
    };

    const renderValueInput = () => {
        const isListOperator = condition.operator === 'in' || condition.operator === 'not_in';

        if (isListOperator) {
            // For list operators, use comma-separated input
            const valueStr = Array.isArray(condition.value) ? condition.value.join(', ') : '';
            return (
                <div className="relative flex-1">
                    <Input
                        placeholder="Value1, Value2, Value3..."
                        value={valueStr}
                        onChange={(e) => {
                            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                            handleValueChange(values);
                        }}
                        className="pr-8"
                    />
                    {valueStr && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleValueChange([])}
                            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                    )}
                </div>
            );
        }

        // For select fields with options
        if (fieldMetadata.type === 'select' && fieldMetadata.options) {
            return (
                <Select
                    value={String(condition.value)}
                    onValueChange={(value) => handleValueChange(value)}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldMetadata.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        // For number fields
        if (fieldMetadata.type === 'number') {
            return (
                <div className="relative flex-1">
                    <Input
                        type="number"
                        placeholder={fieldMetadata.placeholder}
                        value={condition.value as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        className="pr-8"
                    />
                    {condition.value && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleValueChange('')}
                            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                    )}
                </div>
            );
        }

        // Default text input
        return (
            <div className="relative flex-1">
                <Input
                    type="text"
                    placeholder={fieldMetadata.placeholder}
                    value={condition.value as string}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="pr-8"
                />
                {condition.value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleValueChange('')}
                        className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            {/* Field Selector */}
            <Select value={condition.field} onValueChange={handleFieldChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(FIELD_METADATA).map(([key, metadata]) => (
                        <SelectItem key={key} value={key}>
                            {metadata.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Operator Selector */}
            <Select value={condition.operator} onValueChange={handleOperatorChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {validOperators.map((op) => (
                        <SelectItem key={op} value={op}>
                            {OPERATOR_LABELS[op]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Value Input */}
            {renderValueInput()}

            {/* Delete Button */}
            {showDelete && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

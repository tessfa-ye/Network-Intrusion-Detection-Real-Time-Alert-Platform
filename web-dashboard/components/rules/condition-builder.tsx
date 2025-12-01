'use client';

import * as React from 'react';
import { RuleConditionGroup } from '@/types/rule-conditions';
import { emptyGroup } from '@/lib/condition-utils';
import { ConditionGroup } from './condition-group';

interface ConditionBuilderProps {
    value?: RuleConditionGroup;
    onChange: (value: RuleConditionGroup) => void;
}

export function ConditionBuilder({ value, onChange }: ConditionBuilderProps) {
    const [conditions, setConditions] = React.useState<RuleConditionGroup>(() => {
        return value || emptyGroup();
    });

    React.useEffect(() => {
        if (value) {
            setConditions(value);
        }
    }, [value]);

    const handleChange = (newConditions: RuleConditionGroup) => {
        setConditions(newConditions);
        onChange(newConditions);
    };

    return (
        <div className="space-y-4">
            <ConditionGroup
                group={conditions}
                onChange={handleChange}
                isRoot={true}
            />
        </div>
    );
}

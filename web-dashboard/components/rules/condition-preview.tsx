'use client';

import * as React from 'react';
import { Code } from 'lucide-react';
import { RuleCondition } from '@/types/rule-conditions';
import { conditionToString, countConditions } from '@/lib/condition-utils';
import { Card } from '@/components/ui/card';

interface ConditionPreviewProps {
    condition: RuleCondition;
}

export function ConditionPreview({ condition }: ConditionPreviewProps) {
    const previewText = conditionToString(condition);
    const totalConditions = countConditions(condition);

    return (
        <Card className="p-4 bg-muted/30">
            <div className="flex items-start gap-3">
                <Code className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        Condition Preview ({totalConditions} condition{totalConditions !== 1 ? 's' : ''})
                    </div>
                    <div className="font-mono text-sm break-all">
                        {previewText || <span className="text-muted-foreground italic">No conditions defined</span>}
                    </div>
                </div>
            </div>
        </Card>
    );
}

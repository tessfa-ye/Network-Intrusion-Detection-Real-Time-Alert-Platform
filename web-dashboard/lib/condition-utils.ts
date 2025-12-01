import { RuleCondition, RuleConditionItem, RuleConditionGroup, FIELD_METADATA, OPERATOR_LABELS } from '@/types/rule-conditions';

// Generate unique IDs for conditions
let idCounter = 0;
export const generateId = (): string => {
    return `condition_${Date.now()}_${idCounter++}`;
};

// Create an empty condition
export const emptyCondition = (): RuleConditionItem => ({
    type: 'condition',
    id: generateId(),
    field: 'source_ip',
    operator: 'equals',
    value: '',
});

// Create an empty group
export const emptyGroup = (): RuleConditionGroup => ({
    type: 'group',
    id: generateId(),
    operator: 'AND',
    conditions: [emptyCondition()],
});

// Validate a single condition
const isConditionValid = (condition: RuleConditionItem): boolean => {
    if (!condition.field || !condition.operator) return false;

    // Check if value is provided
    if (condition.value === '' || condition.value === null || condition.value === undefined) {
        return false;
    }

    // For 'in' and 'not_in' operators, value should be an array with at least one item
    if ((condition.operator === 'in' || condition.operator === 'not_in')) {
        return Array.isArray(condition.value) && condition.value.length > 0;
    }

    return true;
};

// Validate entire condition tree
export const validateCondition = (condition: RuleCondition): boolean => {
    if (condition.type === 'condition') {
        return isConditionValid(condition);
    }

    // For groups, check operator and that it has at least one valid condition
    if (!condition.operator || condition.conditions.length === 0) {
        return false;
    }

    // Recursively validate all child conditions
    return condition.conditions.every(validateCondition);
};

// Convert condition tree to human-readable string
export const conditionToString = (condition: RuleCondition, indent: number = 0): string => {
    const prefix = '  '.repeat(indent);

    if (condition.type === 'condition') {
        const fieldLabel = FIELD_METADATA[condition.field]?.label || condition.field;
        const operatorLabel = OPERATOR_LABELS[condition.operator] || condition.operator;

        let valueStr: string;
        if (Array.isArray(condition.value)) {
            valueStr = `[${condition.value.join(', ')}]`;
        } else {
            valueStr = String(condition.value);
        }

        return `${fieldLabel} ${operatorLabel} ${valueStr}`;
    }

    // For groups
    const childStrings = condition.conditions.map((child, index) => {
        const childStr = conditionToString(child, 0);
        if (index === 0) {
            return childStr;
        }
        return `${condition.operator} ${childStr}`;
    });

    if (condition.conditions.length === 1) {
        return childStrings[0];
    }

    return `(${childStrings.join(' ')})`;
};

// Convert old format conditions to new format
export const convertLegacyConditions = (oldConditions: any[]): RuleConditionGroup => {
    if (!Array.isArray(oldConditions) || oldConditions.length === 0) {
        return emptyGroup();
    }

    const convertedConditions: RuleConditionItem[] = oldConditions.map((oldCond) => ({
        type: 'condition',
        id: generateId(),
        field: oldCond.field as any || 'event_type',
        operator: mapOldOperator(oldCond.operator),
        value: oldCond.value || '',
    }));

    return {
        type: 'group',
        id: generateId(),
        operator: 'AND',
        conditions: convertedConditions,
    };
};

// Map old operator names to new ones
const mapOldOperator = (oldOp: string): any => {
    const mapping: Record<string, any> = {
        'eq': 'equals',
        'gt': 'greater_than',
        'lt': 'less_than',
        'contains': 'contains',
        'regex': 'regex',
    };
    return mapping[oldOp] || 'equals';
};

// Count total conditions in tree (for display)
export const countConditions = (condition: RuleCondition): number => {
    if (condition.type === 'condition') {
        return 1;
    }
    return condition.conditions.reduce((sum, child) => sum + countConditions(child), 0);
};

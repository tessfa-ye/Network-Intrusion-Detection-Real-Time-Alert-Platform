// Rule condition types for the visual condition builder

export type LogicalOperator = 'AND' | 'OR';

export type ComparisonOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal'
    | 'less_than_or_equal'
    | 'in'
    | 'not_in'
    | 'regex';

export type ConditionField =
    | 'source_ip'
    | 'destination_ip'
    | 'source_port'
    | 'destination_port'
    | 'protocol'
    | 'event_type'
    | 'severity'
    | 'method'
    | 'status_code'
    | 'user_agent'
    | 'path';

export interface RuleConditionItem {
    type: 'condition';
    id: string; // Unique ID for React keys
    field: ConditionField;
    operator: ComparisonOperator;
    value: string | number | string[];
}

export interface RuleConditionGroup {
    type: 'group';
    id: string; // Unique ID for React keys
    operator: LogicalOperator;
    conditions: Array<RuleConditionItem | RuleConditionGroup>;
}

export type RuleCondition = RuleConditionItem | RuleConditionGroup;

// Field metadata for UI rendering
export interface FieldMetadata {
    label: string;
    type: 'string' | 'number' | 'select' | 'ip' | 'multiselect';
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
}

export const FIELD_METADATA: Record<ConditionField, FieldMetadata> = {
    source_ip: {
        label: 'Source IP',
        type: 'ip',
        placeholder: '192.168.1.1',
    },
    destination_ip: {
        label: 'Destination IP',
        type: 'ip',
        placeholder: '10.0.0.1',
    },
    source_port: {
        label: 'Source Port',
        type: 'number',
        placeholder: '80',
    },
    destination_port: {
        label: 'Destination Port',
        type: 'number',
        placeholder: '443',
    },
    protocol: {
        label: 'Protocol',
        type: 'select',
        options: [
            { label: 'TCP', value: 'tcp' },
            { label: 'UDP', value: 'udp' },
            { label: 'ICMP', value: 'icmp' },
            { label: 'HTTP', value: 'http' },
            { label: 'HTTPS', value: 'https' },
        ],
    },
    event_type: {
        label: 'Event Type',
        type: 'string',
        placeholder: 'login_attempt',
    },
    severity: {
        label: 'Severity',
        type: 'select',
        options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' },
        ],
    },
    method: {
        label: 'HTTP Method',
        type: 'select',
        options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'PATCH', value: 'PATCH' },
        ],
    },
    status_code: {
        label: 'Status Code',
        type: 'number',
        placeholder: '404',
    },
    user_agent: {
        label: 'User Agent',
        type: 'string',
        placeholder: 'Mozilla/5.0...',
    },
    path: {
        label: 'URL Path',
        type: 'string',
        placeholder: '/admin',
    },
};

// Operator labels for UI
export const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
    equals: 'Equals',
    not_equals: 'Not Equals',
    contains: 'Contains',
    not_contains: 'Does Not Contain',
    greater_than: 'Greater Than',
    less_than: 'Less Than',
    greater_than_or_equal: 'Greater Than or Equal',
    less_than_or_equal: 'Less Than or Equal',
    in: 'In List',
    not_in: 'Not In List',
    regex: 'Matches Regex',
};

// Valid operators for each field type
export const VALID_OPERATORS: Record<FieldMetadata['type'], ComparisonOperator[]> = {
    string: ['equals', 'not_equals', 'contains', 'not_contains', 'regex'],
    number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'],
    select: ['equals', 'not_equals'],
    ip: ['equals', 'not_equals', 'in', 'not_in'],
    multiselect: ['in', 'not_in'],
};

import { RuleConditionGroup, RuleConditionItem } from '@/types/rule-conditions';
import { generateId } from './condition-utils';

export type TemplateCategory = 'authentication' | 'network' | 'web' | 'system';

export interface RuleTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    severity: 'low' | 'medium' | 'high' | 'critical';
    conditions: RuleConditionGroup;
    tags: string[];
}

export const RULE_TEMPLATES: RuleTemplate[] = [
    // Authentication Templates
    {
        id: 'ssh-brute-force',
        name: 'SSH Brute Force Detection',
        description: 'Detects multiple failed SSH login attempts indicating a brute force attack',
        category: 'authentication',
        severity: 'high',
        tags: ['ssh', 'brute-force', 'authentication'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'equals',
                    value: 'ssh_login_failed',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'destination_port',
                    operator: 'equals',
                    value: '22',
                },
            ],
        },
    },
    {
        id: 'failed-login-attempts',
        name: 'Multiple Failed Login Attempts',
        description: 'Detects repeated failed authentication attempts from any source',
        category: 'authentication',
        severity: 'medium',
        tags: ['login', 'authentication', 'failed'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'OR',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'login_failed',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'authentication_failed',
                },
            ],
        },
    },
    {
        id: 'sudo-privilege-escalation',
        name: 'Sudo Privilege Escalation',
        description: 'Detects attempts to escalate privileges using sudo',
        category: 'authentication',
        severity: 'high',
        tags: ['sudo', 'privilege', 'escalation'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'sudo',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'severity',
                    operator: 'equals',
                    value: 'high',
                },
            ],
        },
    },

    // Network Templates
    {
        id: 'port-scan-detection',
        name: 'Port Scan Detection',
        description: 'Detects network reconnaissance through port scanning activity',
        category: 'network',
        severity: 'medium',
        tags: ['port-scan', 'reconnaissance', 'network'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'port_scan',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'severity',
                    operator: 'equals',
                    value: 'medium',
                },
            ],
        },
    },
    {
        id: 'suspicious-outbound-traffic',
        name: 'Suspicious Outbound Traffic',
        description: 'Detects unusual outbound network connections',
        category: 'network',
        severity: 'high',
        tags: ['outbound', 'traffic', 'network'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'equals',
                    value: 'outbound_connection',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'destination_port',
                    operator: 'in',
                    value: ['4444', '5555', '6666'], // Common backdoor ports
                },
            ],
        },
    },

    // Web Templates
    {
        id: 'sql-injection',
        name: 'SQL Injection Detection',
        description: 'Detects SQL injection attempts in HTTP requests',
        category: 'web',
        severity: 'critical',
        tags: ['sql', 'injection', 'web', 'attack'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'OR',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: "' OR '1'='1",
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: 'UNION SELECT',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: 'DROP TABLE',
                },
            ],
        },
    },
    {
        id: 'xss-attempt',
        name: 'Cross-Site Scripting (XSS) Detection',
        description: 'Detects XSS attack attempts in web requests',
        category: 'web',
        severity: 'high',
        tags: ['xss', 'web', 'attack', 'javascript'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'OR',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: '<script>',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: 'javascript:',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: 'onerror=',
                },
            ],
        },
    },
    {
        id: 'directory-traversal',
        name: 'Directory Traversal Attack',
        description: 'Detects path traversal attempts to access unauthorized files',
        category: 'web',
        severity: 'high',
        tags: ['traversal', 'web', 'attack', 'path'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'OR',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: '../',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: '..\\',
                },
            ],
        },
    },
    {
        id: 'admin-access-attempt',
        name: 'Admin Panel Access Attempt',
        description: 'Detects unauthorized access attempts to admin panels',
        category: 'web',
        severity: 'medium',
        tags: ['admin', 'web', 'access'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: '/admin',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'status_code',
                    operator: 'equals',
                    value: '401',
                },
            ],
        },
    },

    // System Templates
    {
        id: 'suspicious-process',
        name: 'Suspicious Process Execution',
        description: 'Detects execution of potentially malicious processes',
        category: 'system',
        severity: 'critical',
        tags: ['process', 'execution', 'system'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'process',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'severity',
                    operator: 'equals',
                    value: 'critical',
                },
            ],
        },
    },
    {
        id: 'unauthorized-file-access',
        name: 'Unauthorized File Access',
        description: 'Detects attempts to access sensitive files without authorization',
        category: 'system',
        severity: 'high',
        tags: ['file', 'access', 'system', 'unauthorized'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'file_access',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'path',
                    operator: 'contains',
                    value: '/etc/passwd',
                },
            ],
        },
    },
    {
        id: 'malware-signature',
        name: 'Known Malware Signature',
        description: 'Detects known malware signatures in system activity',
        category: 'system',
        severity: 'critical',
        tags: ['malware', 'signature', 'system', 'threat'],
        conditions: {
            type: 'group',
            id: generateId(),
            operator: 'AND',
            conditions: [
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'event_type',
                    operator: 'contains',
                    value: 'malware',
                },
                {
                    type: 'condition',
                    id: generateId(),
                    field: 'severity',
                    operator: 'equals',
                    value: 'critical',
                },
            ],
        },
    },
];

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string }> = {
    authentication: { label: 'Authentication', icon: '🔐' },
    network: { label: 'Network', icon: '🌐' },
    web: { label: 'Web', icon: '🕸️' },
    system: { label: 'System', icon: '💻' },
};

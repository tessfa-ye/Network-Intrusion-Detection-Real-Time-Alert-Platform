const API_URL = 'http://localhost:5000/api';

const DEFAULT_RULES = [
    {
        name: 'SSH Brute Force Detection',
        description: 'Detects multiple failed login attempts from a single source IP',
        severity: 'high',
        enabled: true,
        conditions: [
            {
                eventType: 'login',
                field: 'description',
                operator: 'contains',
                value: 'Failed login',
                threshold: 10,
                timeWindow: 300 // 5 minutes
            }
        ],
        actions: [{ type: 'alert', config: {} }]
    },
    {
        name: 'Data Exfiltration Alert',
        description: 'Detects unusually large outbound data transfer',
        severity: 'critical',
        enabled: true,
        conditions: [
            {
                eventType: 'network',
                field: 'metadata.bytesSent',
                operator: 'gt',
                value: 10000000, // 10MB
                threshold: 1
            }
        ],
        actions: [{ type: 'alert', config: {} }]
    }
];

async function seedRules() {
    console.log('--- NIDAS Rule Seeder Starting ---');

    // 1. Get existing rules
    try {
        const response = await fetch(`${API_URL}/rules`);
        const existingRules = await response.json() as any[];

        for (const rule of DEFAULT_RULES) {
            const exists = existingRules.some(r => r.name === rule.name);
            if (exists) {
                console.log(`ℹ️ Rule already exists: ${rule.name}`);
                continue;
            }

            const createResponse = await fetch(`${API_URL}/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rule)
            });

            if (createResponse.ok) {
                console.log(`✅ Created rule: ${rule.name}`);
            } else {
                console.log(`❌ Failed to create rule: ${rule.name}`);
            }
        }
    } catch (error: any) {
        console.error(`❌ Connection error: ${error.message}`);
    }

    console.log('--- Seeding Complete ---');
}

seedRules();

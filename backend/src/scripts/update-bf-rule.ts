const API_URL = 'http://localhost:5000/api';

async function updateBruteForceRule() {
    console.log('--- Updating Brute Force Rule to User Requirements ---');
    try {
        const response = await fetch(`${API_URL}/rules`);
        const rules = await response.json() as any[];
        const rule = rules.find(r => r.name === 'SSH Brute Force Detection');

        if (rule) {
            const updatePayload = {
                conditions: [
                    {
                        eventType: 'login',
                        field: 'description',
                        operator: 'contains',
                        value: 'Failed login',
                        threshold: 5,     // Changed from 10 to 5
                        timeWindow: 60    // Changed from 300 to 60
                    }
                ]
            };

            const updateResponse = await fetch(`${API_URL}/rules/${rule._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (updateResponse.ok) {
                console.log('✅ Rule updated successfully: 5 attempts / 1 minute');
            }
        } else {
            console.log('❌ Rule not found. Please run seed-rules.ts first.');
        }
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
    }
}

updateBruteForceRule();

const API_URL = 'http://localhost:5000/api';

const EVENT_TYPES = ['login', 'api_access', 'firewall', 'file_access', 'network'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const SOURCE_IPS = ['192.168.1.10', '10.0.0.5', '45.77.12.34', '185.22.1.99', '172.16.0.44'];

async function sendEvent(payload: any) {
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            console.log(`✅ Event sent: ${payload.description} (${payload.severity})`);
        } else {
            console.log(`⚠️ Status ${response.status} when sending event: ${payload.description}`);
        }
    } catch (error: any) {
        console.error(`❌ Failed to send event: ${error.message}`);
    }
}

async function simulateBruteForce(ip: string) {
    console.log(`🚀 Simulating Brute Force from ${ip}...`);
    for (let i = 0; i < 15; i++) {
        await sendEvent({
            timestamp: new Date(),
            eventType: 'login_failed',
            severity: 'medium',
            sourceIP: ip,
            description: `Failed login attempt for user 'admin'`,
            metadata: {
                attemptNumber: i + 1,
                user: 'admin',
                browser: 'Mozilla/5.0'
            }
        });
        // Short delay
        await new Promise(r => setTimeout(r, 500));
    }
}

async function simulateLargeTransfer(ip: string) {
    console.log(`🚀 Simulating Large Data Transfer from ${ip}...`);
    await sendEvent({
        timestamp: new Date(),
        eventType: 'network',
        severity: 'high',
        sourceIP: ip,
        targetIP: '8.8.8.8',
        description: `Unusually large outbound data transfer detected`,
        metadata: {
            bytesSent: 1024 * 1024 * 50, // 50MB
            protocol: 'TCP',
            port: 443
        }
    });
}

async function simulateRandomTraffic() {
    const randomIP = SOURCE_IPS[Math.floor(Math.random() * SOURCE_IPS.length)];
    const randomType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const randomSeverity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];

    await sendEvent({
        timestamp: new Date(),
        eventType: randomType,
        severity: randomSeverity,
        sourceIP: randomIP,
        description: `Standard ${randomType} activity log`,
        metadata: {
            processId: Math.floor(Math.random() * 10000)
        }
    });
}

async function run() {
    console.log('--- NIDAS Traffic Simulator Starting (Infinite Loop) ---');

    const EXTENDED_IPS = [
        '45.77.12.34', '185.22.1.99', '104.21.45.1', '13.107.42.12', 
        '157.240.22.35', '172.217.14.206', '31.13.71.36', '103.235.46.39',
        '202.162.247.1'
    ];

    while (true) {
        // 1. Send some random background noise
        for (let i = 0; i < 3; i++) {
            await simulateRandomTraffic();
            await new Promise(r => setTimeout(r, 1000));
        }

        // 2. Trigger a specific rule (Brute Force) from a random IP
        const bfIP = EXTENDED_IPS[Math.floor(Math.random() * EXTENDED_IPS.length)];
        await simulateBruteForce(bfIP);

        // 3. Trigger another random high severity event
        const exIP = EXTENDED_IPS[Math.floor(Math.random() * EXTENDED_IPS.length)];
        await simulateLargeTransfer(exIP);

        console.log('--- Burst Complete. Waiting for next cycle... ---');
        await new Promise(r => setTimeout(r, 10000)); // Wait 10s between bursts
    }
}

run();

const { io } = require('socket.io-client');
const fetch = require('node-fetch'); // We might not have node-fetch, let's use built-in fetch if Node >= 18 or axios

const API_URL = 'http://127.0.0.1:5000/api';

async function testWebSocket() {
    // 1. Authenticate as admin
    const authRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@nidas.local', password: 'Admin123!' })
    });
    
    if (!authRes.ok) {
        console.error('Failed to auth', await authRes.text());
        return;
    }
    const { accessToken, user } = await authRes.json();
    console.log('✅ Authenticated as admin. Token acquired.');

    // 2. Connect to WebSocket
    const socket = io('http://127.0.0.1:5000', {
        auth: { token: accessToken },
        transports: ['websocket']
    });

    socket.on('connect', async () => {
        console.log('✅ WebSocket Connected. ID:', socket.id);
        socket.emit('subscribe:events');
        socket.emit('subscribe:alerts');
        
        // 3. Wait a moment for subscription, then send an event
        setTimeout(async () => {
            console.log('🚀 Sending a test event...');
            const eventRes = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    timestamp: new Date(),
                    eventType: 'test_event',
                    severity: 'low',
                    sourceIP: '127.0.0.1',
                    description: `Test event from script`,
                })
            });
            console.log('📤 Event sent status:', eventRes.status);
            
            // Wait to see if we receive it, then exit
            setTimeout(() => process.exit(0), 3000);
        }, 1000);
    });

    socket.on('event:new', (event) => {
        console.log('🚨 RECEIVED NEW EVENT:', event.eventType);
    });

    socket.on('alert:new', (alert) => {
        console.log('⚠️ RECEIVED NEW ALERT:', alert.ruleName);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected');
    });
}

testWebSocket();

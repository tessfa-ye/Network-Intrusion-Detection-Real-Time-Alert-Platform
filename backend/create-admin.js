const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const client = new MongoClient('mongodb://admin:changeme123@mongodb:27017/nidas?authSource=admin');

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('nidas');
        const users = db.collection('users');

        // Check if admin exists
        const existing = await users.findOne({ email: 'admin@nidas.local' });
        if (existing) {
            console.log('ℹ️  Admin user already exists');
            return;
        }

        // Create admin user
        const passwordHash = await bcrypt.hash('Admin123!', 10);

        await users.insertOne({
            email: 'admin@nidas.local',
            passwordHash,
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            authProvider: 'local',
            active: true,
            notificationPreferences: {
                email: true,
                sms: false,
                push: true,
                minSeverity: 'medium'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@nidas.local');
        console.log('🔑 Password: Admin123!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

createAdmin();

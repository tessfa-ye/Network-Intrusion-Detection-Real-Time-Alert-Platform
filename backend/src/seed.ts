import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@nidas.local' },
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists');
        await app.close();
        return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    await prisma.user.create({
        data: {
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
                minSeverity: 'medium',
            },
        },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@nidas.local');
    console.log('🔑 Password: Admin123!');

    await app.close();
}

seed().catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
});

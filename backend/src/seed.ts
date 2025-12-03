import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    // Check if admin user exists
    const existingAdmin = await userModel.findOne({ email: 'admin@nidas.local' });

    if (existingAdmin) {
        console.log('✅ Admin user already exists');
        await app.close();
        return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const adminUser = new userModel({
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
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@nidas.local');
    console.log('🔑 Password: Admin123!');

    await app.close();
}

seed().catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
});

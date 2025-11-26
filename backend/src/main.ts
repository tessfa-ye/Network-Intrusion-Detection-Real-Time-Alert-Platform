import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS configuration
    app.enableCors({
        origin: configService.get('CORS_ORIGIN')?.split(',') || '*',
        credentials: true,
    });

    // API prefix
    app.setGlobalPrefix('api');

    const port = configService.get('PORT') || 3000;
    await app.listen(port);

    console.log(`\n🚀 NIDAS Backend running on: http://localhost:${port}/api`);
    console.log(`📊 Environment: ${configService.get('NODE_ENV')}`);
    console.log(`🗄️  MongoDB: ${configService.get('MONGODB_URI')?.split('@')[1] || 'Connected'}\n`);
}

bootstrap();

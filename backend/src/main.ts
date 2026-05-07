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

    // CORS configuration - mandatory for cross-domain cookies/auth
    const corsOrigin = configService.get('CORS_ORIGIN');
    app.enableCors({
        origin: corsOrigin ? corsOrigin.split(',') : true, // 'true' reflects the request origin
        credentials: true,
    });

    // API prefix
    app.setGlobalPrefix('api');

    const port = configService.get('PORT') || 5000;
    await app.listen(port, '0.0.0.0');

    console.log(`\n🚀 NIDAS Backend running on: http://localhost:${port}/api`);
    console.log(`📊 Environment: ${configService.get('NODE_ENV')}`);
    console.log(`🗄️  PostgreSQL: Connected\n`);
}

bootstrap();

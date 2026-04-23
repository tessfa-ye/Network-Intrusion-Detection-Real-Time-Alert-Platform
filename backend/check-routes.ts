import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();
  const router = server._events.request._router;

  const availableRoutes: [] = router.stack
    .filter(r => r.route)
    .map(r => {
      return {
        path: r.route.path,
        method: Object.keys(r.route.methods)[0].toUpperCase()
      };
    });

  console.log(JSON.stringify(availableRoutes, null, 2));
  process.exit(0);
}

bootstrap();

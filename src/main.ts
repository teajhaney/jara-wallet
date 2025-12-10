import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });

  // Enable CORS for Swagger UI and API access
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  });

  const configService = app.get(ConfigService);

  // Enable global validation pipe for proper error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
      stopAtFirstError: false, // Show all validation errors
    }),
  );

  // Setup Swagger documentation
  setupSwagger(app);

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);

  // Log Swagger endpoint
  const appUrl =
    configService.get<string>('appUrl') || `http://localhost:${port}`;
  const swaggerUrl = `${appUrl}/docs`;

  console.log(`📚 Swagger documentation available at: ${swaggerUrl}`);
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

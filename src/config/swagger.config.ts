import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication): void {
  try {
    const configService = app.get(ConfigService, { strict: false });

    // Determine the app URL based on environment
    let appUrl: string;

    // Check Vercel environment variables first (auto-provided by Vercel)
    if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.APP_URL) {
      // Check APP_URL directly from env (in case config not loaded yet)
      appUrl = process.env.APP_URL;
    } else if (configService?.get<string>('appUrl')) {
      appUrl = configService.get<string>('appUrl')!;
    } else {
      // Default to localhost - detect port from config or default to 3000
      const port = configService?.get<number>('port') || 3000;
      appUrl = `http://localhost:${port}`;
    }

    // Ensure URL has proper protocol
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      appUrl = `https://${appUrl}`;
    }

    console.log(`🔧 Setting up Swagger with appUrl: ${appUrl}`);

    const config = new DocumentBuilder()
      .setTitle('Jara Wallet API')
      .setDescription(
        'API documentation for Jara Wallet - A digital wallet system with payment integration',
      )
      .setVersion('1.0')
      .addServer(appUrl, 'Current server')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Enter API Key',
        },
        'API-Key', // This name here is important for matching up with @ApiKeyAuth() in your controller!
      )
      //   .addTag('auth', 'Authentication endpoints')
      .addTag('wallet', 'Wallet management endpoints')
      .addTag('keys', 'API key management endpoints')
      .addTag('app', 'Application health check')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'Jara Wallet API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      customJs: [],
    });

    console.log('✅ Swagger documentation initialized successfully at /api');
    console.log(`📚 Swagger UI available at: ${appUrl}/api`);
  } catch (error) {
    console.error('❌ Failed to initialize Swagger:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    // Don't throw - allow app to continue without Swagger
  }
}

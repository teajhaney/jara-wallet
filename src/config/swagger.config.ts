import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Custom Swagger HTML that loads assets from CDN (required for Vercel serverless)
// Uses relative URL for JSON to avoid CORS issues between preview/production domains
function getSwaggerHtml(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jara Wallet API Documentation</title>
  <link rel="icon" type="image/png" href="https://swagger.io/favicon-32x32.png">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "./api-json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        docExpansion: "none",
        filter: true,
        showRequestDuration: true
      });
    };
  </script>
</body>
</html>`;
}

export function setupSwagger(app: INestApplication): void {
  try {
    const configService = app.get(ConfigService, { strict: false });

    // Determine the app URL based on environment
    let appUrl: string;

    // Priority: APP_URL (production) > VERCEL_URL (preview) > config > localhost
    // This ensures production domain is used when set
    if (process.env.APP_URL) {
      appUrl = process.env.APP_URL;
    } else if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
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
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Enter API Key',
        },
        'API-Key',
      )
      .addTag('wallet', 'Wallet management endpoints')
      .addTag('keys', 'API key management endpoints')
      .addTag('app', 'Application health check')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Get the underlying HTTP adapter to serve custom routes
    const httpAdapter = app.getHttpAdapter();

    // Serve the OpenAPI JSON spec
    httpAdapter.get(
      '/api-json',
      (req: unknown, res: { json: (doc: object) => void }) => {
        res.json(document);
      },
    );

    // Serve custom Swagger UI HTML that loads from CDN
    // Uses relative URL (./api-json) to avoid CORS issues
    httpAdapter.get(
      '/api',
      (
        req: unknown,
        res: { type: (t: string) => { send: (html: string) => void } },
      ) => {
        res.type('text/html').send(getSwaggerHtml());
      },
    );

    console.log('✅ Swagger documentation initialized successfully at /api');
    console.log(`📚 Swagger UI available at: ${appUrl}/api`);
    console.log(`📄 OpenAPI JSON available at: ${appUrl}/api-json`);
  } catch (error) {
    console.error('❌ Failed to initialize Swagger:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    // Don't throw - allow app to continue without Swagger
  }
}

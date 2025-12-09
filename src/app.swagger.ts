import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiAppTag = () => ApiTags('app');

export const ApiGetHello = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Health check endpoint',
      description: 'Returns the health status and basic information about the API',
    }),
    ApiResponse({
      status: 200,
      description: 'API is healthy and running',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'healthy',
            description: 'Health status of the API',
          },
          service: {
            type: 'string',
            example: 'Jara Wallet API',
            description: 'Name of the service',
          },
          version: {
            type: 'string',
            example: '1.0.0',
            description: 'API version',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: 'Current server timestamp',
          },
          uptime: {
            type: 'object',
            properties: {
              seconds: {
                type: 'number',
                example: 1234,
                description: 'Server uptime in seconds',
              },
              formatted: {
                type: 'string',
                example: '20m 34s',
                description: 'Human-readable uptime format (e.g., "2d 3h 20m 34s")',
              },
            },
            description: 'Server uptime information',
          },
          environment: {
            type: 'string',
            example: 'production',
            description: 'Current environment',
          },
          message: {
            type: 'string',
            example: 'API is running successfully',
            description: 'Status message',
          },
        },
      },
    }),
  );


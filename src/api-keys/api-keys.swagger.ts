import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { ApiKeyListItemDto } from './dto/api-key-list-item.dto';

export const ApiKeysTag = () => ApiTags('keys');

export const ApiKeysAuth = () => ApiBearerAuth('JWT-auth');

export const ApiCreateApiKey = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create API key' }),
    ApiResponse({ status: 201, type: ApiKeyResponseDto }),
    ApiResponse({ status: 400 }),
    ApiResponse({ status: 401 }),
  );

export const ApiRolloverApiKey = () =>
  applyDecorators(
    ApiOperation({ summary: 'Rollover expired API key' }),
    ApiResponse({ status: 201, type: ApiKeyResponseDto }),
    ApiResponse({ status: 400 }),
    ApiResponse({ status: 401 }),
    ApiResponse({ status: 404 }),
  );

export const ApiGetApiKeys = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all API keys with optional filtering',
      description: `Returns API keys for the authenticated user. You can filter by status:
- \`active\`: Returns only active (not expired, not revoked) API keys
- \`revoked\`: Returns only revoked API keys
- \`all\`: Returns all API keys (default)

The full API keys are returned and can be used for authentication.`,
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['active', 'revoked', 'all'],
      description: 'Filter API keys by status',
      example: 'active',
    }),
    ApiResponse({
      status: 200,
      description: 'List of API keys with full keys',
      type: [ApiKeyListItemDto],
    }),
    ApiResponse({ status: 401 }),
  );

export const ApiRevokeApiKey = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Revoke an API key',
      description:
        'Revokes an API key by setting revoked = true. Once revoked, the API key can no longer be used for authentication.',
    }),
    ApiParam({
      name: 'id',
      description: 'API key ID to revoke',
      example: 'clx1234567890',
    }),
    ApiResponse({
      status: 200,
      description: 'API key revoked successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'API key revoked successfully',
          },
          api_key_id: {
            type: 'string',
            example: 'clx1234567890',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'API key is already revoked' }),
    ApiResponse({ status: 401 }),
    ApiResponse({ status: 404, description: 'API key not found' }),
  );

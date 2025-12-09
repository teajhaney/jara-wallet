import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';

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


import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiAppTag = () => ApiTags('app');

export const ApiGetHello = () =>
  applyDecorators(
    ApiOperation({ summary: 'Health check endpoint' }),
    ApiResponse({ status: 200 }),
  );


import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, RolloverApiKeyDto, GetApiKeysQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiKeysTag,
  ApiKeysAuth,
  ApiCreateApiKey,
  ApiRolloverApiKey,
  ApiGetApiKeys,
  ApiRevokeApiKey,
} from './api-keys.swagger';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

@ApiKeysTag()
@Controller('keys')
@UseGuards(JwtAuthGuard) // All endpoints require JWT authentication
@ApiKeysAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateApiKey()
  async createApiKey(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateApiKeyDto,
  ) {
    const userId: string = req.user.id;
    return this.apiKeysService.createApiKey(userId, createDto);
  }

  @Post('rollover')
  @HttpCode(HttpStatus.CREATED)
  @ApiRolloverApiKey()
  async rolloverApiKey(
    @Request() req: AuthenticatedRequest,
    @Body() rolloverDto: RolloverApiKeyDto,
  ) {
    const userId: string = req.user.id;
    return this.apiKeysService.rolloverApiKey(userId, rolloverDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiGetApiKeys()
  async getApiKeys(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetApiKeysQueryDto,
  ) {
    const userId: string = req.user.id;
    const status: 'active' | 'revoked' | 'all' = query.status || 'all';
    return this.apiKeysService.getUserApiKeys(userId, status);
  }

  @Delete('revoke/:id')
  @HttpCode(HttpStatus.OK)
  @ApiRevokeApiKey()
  async revokeApiKey(
    @Request() req: AuthenticatedRequest,
    @Param('id') apiKeyId: string,
  ) {
    const userId: string = req.user.id;
    await this.apiKeysService.revokeApiKey(userId, apiKeyId);
    return {
      message: 'API key revoked successfully',
      api_key_id: apiKeyId,
    };
  }
}

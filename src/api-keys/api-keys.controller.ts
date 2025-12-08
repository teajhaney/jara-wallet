import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

@Controller('keys')
@UseGuards(JwtAuthGuard) // All endpoints require JWT authentication
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateApiKeyDto,
  ) {
    const userId: string = req.user.id;
    return this.apiKeysService.createApiKey(userId, createDto);
  }

  @Post('rollover')
  @HttpCode(HttpStatus.CREATED)
  async rolloverApiKey(
    @Request() req: AuthenticatedRequest,
    @Body() rolloverDto: RolloverApiKeyDto,
  ) {
    const userId: string = req.user.id;
    return this.apiKeysService.rolloverApiKey(userId, rolloverDto);
  }
}

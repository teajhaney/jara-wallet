import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';
import { Request } from 'express';

interface ApiKeyAuthenticatedRequest extends Request {
  user: {
    id: string;
  };
  apiKey: {
    id: string;
    permissions: string[];
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const keyData = await this.apiKeysService.validateApiKey(apiKey);

      // Attach user and permissions to request object
      const authenticatedRequest = request as ApiKeyAuthenticatedRequest;
      authenticatedRequest.user = { id: keyData.userId };
      authenticatedRequest.apiKey = {
        id: keyData.apiKeyId,
        permissions: keyData.permissions,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired API key');
    }
  }
}

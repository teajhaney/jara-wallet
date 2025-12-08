import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';

interface CombinedAuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string | null;
  };
  apiKey?: {
    id: string;
    permissions: string[];
  };
}

/**
 * Combined authentication guard that supports both JWT and API Key authentication
 * Checks for x-api-key header first, then falls back to JWT
 */
@Injectable()
export class CombinedAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    // If API key is provided, validate it
    if (apiKey) {
      try {
        const keyData = await this.apiKeysService.validateApiKey(apiKey);

        // Attach user and API key info to request
        const authenticatedRequest = request as CombinedAuthRequest;
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

    // If no API key, try JWT authentication (call parent)
    try {
      const result = await super.canActivate(context);
      if (result instanceof Observable) {
        const promiseResult = await result.toPromise();
        return promiseResult ?? false;
      }
      return Boolean(result);
    } catch {
      throw new UnauthorizedException(
        'Authentication required. Provide JWT token or API key',
      );
    }
  }
}

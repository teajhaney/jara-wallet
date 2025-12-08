import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';
import { ApiKeyResponse } from './types/api-key.types';

@Injectable()
export class ApiKeysService {
  private readonly MAX_ACTIVE_KEYS = 5;
  private readonly KEY_PREFIX = 'sk_live_';
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  //Convert expiry string (1H, 1D, 1M, 1Y) to a Date object

  private convertExpiryToDate(expiry: string): Date {
    const now = new Date();
    const expiryMap: Record<string, number> = {
      '1H': 60 * 60 * 1000, // 1 hour in milliseconds
      '1D': 24 * 60 * 60 * 1000, // 1 day
      '1M': 30 * 24 * 60 * 60 * 1000, // 30 days (approximate month)
      '1Y': 365 * 24 * 60 * 60 * 1000, // 365 days
    };

    const milliseconds = expiryMap[expiry];
    if (!milliseconds) {
      throw new BadRequestException(
        'Invalid expiry format. Must be one of: 1H, 1D, 1M, 1Y',
      );
    }

    return new Date(now.getTime() + milliseconds);
  }

  // Generate a unique API key string
  private generateApiKey(): string {
    // Generate a random string (32 characters)
    const randomBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
    return `${this.KEY_PREFIX}${randomBytes}`;
  }

  //Count active API keys for a user (not expired, not revoked)
  private async countActiveKeys(userId: string): Promise<number> {
    const now = new Date();
    const count: number = await this.prisma.apiKey.count({
      where: {
        userId,
        revoked: false,
        expiresAt: {
          gt: now,
        },
      },
    });
    return count;
  }

  // Create a new API key for a user
  async createApiKey(
    userId: string,
    createDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponse> {
    // Validate required fields (defensive check in case validation pipe fails)
    if (!createDto.name) {
      throw new BadRequestException('name is required');
    }

    if (!createDto.permissions || createDto.permissions.length === 0) {
      throw new BadRequestException(
        'permissions is required and must contain at least one permission',
      );
    }

    if (!createDto.expiry) {
      throw new BadRequestException('expiry is required');
    }

    // Check if user has reached the maximum number of active keys
    const activeKeyCount = await this.countActiveKeys(userId);
    if (activeKeyCount >= this.MAX_ACTIVE_KEYS) {
      throw new BadRequestException(
        `Maximum of ${this.MAX_ACTIVE_KEYS} active API keys allowed per user`,
      );
    }

    // Generate API key
    const apiKey = this.generateApiKey();
    const keyPrefix = `${this.KEY_PREFIX}${apiKey.slice(this.KEY_PREFIX.length, this.KEY_PREFIX.length + 8)}xxxxx`;

    // Hash the API key for storage
    const keyHash = await bcrypt.hash(apiKey, this.SALT_ROUNDS);

    // Convert expiry to date
    const expiresAt = this.convertExpiryToDate(createDto.expiry);

    // Create API key in database
    await this.prisma.apiKey.create({
      data: {
        userId,
        name: createDto.name,
        keyHash,
        keyPrefix,
        permissions: createDto.permissions,
        expiresAt,
      },
    });

    return {
      api_key: apiKey, // Return the plain key only once
      expires_at: expiresAt.toISOString(),
    };
  }

  // Rollover an expired API key (create new key with same permissions)

  async rolloverApiKey(
    userId: string,
    rolloverDto: RolloverApiKeyDto,
  ): Promise<ApiKeyResponse> {
    // Validate required fields (defensive check in case validation pipe fails)
    if (!rolloverDto.expired_key_id) {
      throw new BadRequestException('expired_key_id is required');
    }

    if (!rolloverDto.expiry) {
      throw new BadRequestException('expiry is required');
    }

    // Find the expired key
    const expiredKey = await this.prisma.apiKey.findFirst({
      where: {
        id: rolloverDto.expired_key_id,
        userId, // Ensure the key belongs to the user
      },
    });

    if (!expiredKey) {
      throw new NotFoundException('API key not found');
    }

    // Check if key is actually expired
    const now = new Date();
    if (expiredKey.expiresAt > now) {
      throw new BadRequestException(
        'Cannot rollover an active API key. Key must be expired.',
      );
    }

    // Check if key is revoked
    if (expiredKey.revoked) {
      throw new BadRequestException('Cannot rollover a revoked API key');
    }

    // Check if user has reached the maximum number of active keys
    const activeKeyCount = await this.countActiveKeys(userId);
    if (activeKeyCount >= this.MAX_ACTIVE_KEYS) {
      throw new BadRequestException(
        `Maximum of ${this.MAX_ACTIVE_KEYS} active API keys allowed per user`,
      );
    }

    // Generate new API key
    const apiKey = this.generateApiKey();
    const keyPrefix = `${this.KEY_PREFIX}${apiKey.slice(this.KEY_PREFIX.length, this.KEY_PREFIX.length + 8)}xxxxx`;

    // Hash the new API key
    const keyHash = await bcrypt.hash(apiKey, this.SALT_ROUNDS);

    // Convert expiry to date
    const expiresAt = this.convertExpiryToDate(rolloverDto.expiry);

    // Create new API key with same permissions
    await this.prisma.apiKey.create({
      data: {
        userId,
        name: expiredKey.name, // Use same name or could allow customization
        keyHash,
        keyPrefix,
        permissions: expiredKey.permissions, // Reuse same permissions
        expiresAt,
      },
    });

    return {
      api_key: apiKey,
      expires_at: expiresAt.toISOString(),
    };
  }

  //Validate an API key from the x-api-key header

  async validateApiKey(apiKey: string): Promise<{
    userId: string;
    apiKeyId: string;
    permissions: string[];
  }> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Find all API keys (we need to check each one since keys are hashed)
    // In production, you might want to optimize this with a lookup table
    const allKeys = await this.prisma.apiKey.findMany({
      where: {
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Check each key hash
    for (const keyRecord of allKeys) {
      const isValid = await bcrypt.compare(apiKey, keyRecord.keyHash as string);
      if (isValid) {
        return {
          userId: keyRecord.userId,
          apiKeyId: keyRecord.id,
          permissions: keyRecord.permissions,
        };
      }
    }

    throw new UnauthorizedException('Invalid or expired API key');
  }

  // Revoke an API key4

  async revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.revoked) {
      throw new BadRequestException('API key is already revoked');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { revoked: true },
    });
  }

  // Get all API keys for a user (for management purposes)

  async getUserApiKeys(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      keyPrefix: string;
      permissions: string[];
      expiresAt: Date;
      revoked: boolean;
      createdAt: Date;
    }>
  > {
    const keys: Array<{
      id: string;
      name: string;
      keyPrefix: string;
      permissions: string[];
      expiresAt: Date;
      revoked: boolean;
      createdAt: Date;
    }> = await this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        revoked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return keys;
  }
}

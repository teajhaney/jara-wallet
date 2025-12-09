import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  const mockPrismaService = {
    apiKey: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    const userId = 'user-123';
    const createDto: CreateApiKeyDto = {
      name: 'Test API Key',
      permissions: ['read', 'deposit'],
      expiry: '1D',
    };

    it('should create API key successfully', async () => {
      mockPrismaService.apiKey.count.mockResolvedValue(2); // Less than max
      mockPrismaService.apiKey.create.mockResolvedValue({
        id: 'key-123',
        expiresAt: new Date(),
      });

      const result = await service.createApiKey(userId, createDto);

      expect(result).toHaveProperty('api_key');
      expect(result).toHaveProperty('expires_at');
      expect(result.api_key).toMatch(/^sk_live_/);
      expect(mockPrismaService.apiKey.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if max active keys reached', async () => {
      mockPrismaService.apiKey.count.mockResolvedValue(5); // Max keys

      await expect(service.createApiKey(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.apiKey.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if name is missing', async () => {
      const invalidDto = { ...createDto, name: '' };

      await expect(service.createApiKey(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if permissions are empty', async () => {
      const invalidDto = { ...createDto, permissions: [] };

      await expect(service.createApiKey(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if expiry is missing', async () => {
      const invalidDto = { ...createDto, expiry: '' };

      await expect(service.createApiKey(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rolloverApiKey', () => {
    const userId = 'user-123';
    const rolloverDto: RolloverApiKeyDto = {
      expired_key_id: 'key-123',
      expiry: '1M',
    };

    const mockExpiredKey = {
      id: 'key-123',
      userId,
      name: 'Old Key',
      permissions: ['read', 'deposit'],
      expiresAt: new Date(Date.now() - 1000), // Expired
      revoked: false,
    };

    it('should rollover expired API key successfully', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue(mockExpiredKey);
      mockPrismaService.apiKey.count.mockResolvedValue(2);
      mockPrismaService.apiKey.create.mockResolvedValue({
        id: 'key-456',
        expiresAt: new Date(),
      });

      const result = await service.rolloverApiKey(userId, rolloverDto);

      expect(result).toHaveProperty('api_key');
      expect(result).toHaveProperty('expires_at');
      // Note: rolloverApiKey doesn't revoke the old key, it just creates a new one
      expect(mockPrismaService.apiKey.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if key not found', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.rolloverApiKey(userId, rolloverDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if key is not expired', async () => {
      const activeKey = {
        ...mockExpiredKey,
        expiresAt: new Date(Date.now() + 86400000), // Not expired
      };
      mockPrismaService.apiKey.findFirst.mockResolvedValue(activeKey);

      await expect(service.rolloverApiKey(userId, rolloverDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if max active keys reached', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue(mockExpiredKey);
      mockPrismaService.apiKey.count.mockResolvedValue(5); // Max keys

      await expect(service.rolloverApiKey(userId, rolloverDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateApiKey', () => {
    const mockApiKey = {
      id: 'key-123',
      userId: 'user-123',
      permissions: ['read', 'deposit'],
      expiresAt: new Date(Date.now() + 86400000), // Not expired
      revoked: false,
    };

    it('should validate API key successfully', async () => {
      const mockApiKeyWithHash = {
        ...mockApiKey,
        keyHash:
          '$2b$10$hashedkey1234567890123456789012345678901234567890123456789012',
      };
      mockPrismaService.apiKey.findMany.mockResolvedValue([mockApiKeyWithHash]);

      // Mock bcrypt.compare to return true for valid key
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateApiKey('sk_live_test123');

      expect(result).toEqual({
        userId: mockApiKey.userId,
        apiKeyId: mockApiKey.id,
        permissions: mockApiKey.permissions,
      });
      expect(mockPrismaService.apiKey.findMany).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid API key', async () => {
      const mockApiKeyWithHash = {
        ...mockApiKey,
        keyHash:
          '$2b$10$hashedkey1234567890123456789012345678901234567890123456789012',
      };
      mockPrismaService.apiKey.findMany.mockResolvedValue([mockApiKeyWithHash]);

      // Mock bcrypt.compare to return false for invalid key
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateApiKey('sk_live_invalid')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.apiKey.findMany).toHaveBeenCalled();
    });
  });
});

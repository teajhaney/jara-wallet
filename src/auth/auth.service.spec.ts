import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockWalletService = {
    createWallet: jest.fn(),
    ensureWalletExists: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateGoogleUser', () => {
    const mockGoogleProfile = {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should return existing user if found by googleId', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(mockGoogleProfile);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: mockGoogleProfile.googleId },
      });
      expect(mockWalletService.createWallet).not.toHaveBeenCalled();
    });

    it('should update existing user with googleId if found by email', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        googleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        googleId: 'google-123',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Not found by googleId
        .mockResolvedValueOnce(existingUser); // Found by email

      mockPrismaService.user.update.mockResolvedValue(updatedUser);
      mockWalletService.ensureWalletExists.mockResolvedValue(undefined);

      const result = await service.validateGoogleUser(mockGoogleProfile);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: { googleId: mockGoogleProfile.googleId },
      });
      expect(mockWalletService.ensureWalletExists).toHaveBeenCalledWith(
        existingUser.id,
      );
    });

    it('should create new user if not found', async () => {
      const newUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Not found by googleId
        .mockResolvedValueOnce(null); // Not found by email

      mockPrismaService.user.create.mockResolvedValue(newUser);
      mockWalletService.createWallet.mockResolvedValue(undefined);

      const result = await service.validateGoogleUser(mockGoogleProfile);

      expect(result).toEqual(newUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          googleId: mockGoogleProfile.googleId,
          email: mockGoogleProfile.email,
          name: mockGoogleProfile.name,
        },
      });
      expect(mockWalletService.createWallet).toHaveBeenCalledWith(newUser.id);
    });
  });

  describe('generateJwtToken', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'google-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate JWT token successfully', () => {
      const mockToken = 'mock-jwt-token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = service.generateJwtToken(mockUser);

      expect(result.access_token).toBe(mockToken);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });
  });
});

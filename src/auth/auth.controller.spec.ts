import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { GoogleProfile } from './types/auth.types';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateGoogleUser: jest.fn(),
    generateJwtToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuthCallback', () => {
    const mockGoogleProfile: GoogleProfile = {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'google-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTokenData = {
      access_token: 'mock-jwt-token',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      },
    };

    it('should return JWT token and user data on successful authentication', async () => {
      interface MockAuthenticatedRequest {
        user: GoogleProfile | null;
      }

      const mockRequest: MockAuthenticatedRequest = {
        user: mockGoogleProfile,
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(mockUser);
      mockAuthService.generateJwtToken.mockReturnValue(mockTokenData);

      const result = await controller.googleAuthCallback(mockRequest);

      expect(result).toEqual({
        access_token: mockTokenData.access_token,
        user: mockTokenData.user,
        message: 'Authentication successful',
      });
      expect(mockAuthService.validateGoogleUser).toHaveBeenCalledWith(
        mockGoogleProfile,
      );
      expect(mockAuthService.generateJwtToken).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException if user not found in request', async () => {
      interface MockAuthenticatedRequest {
        user: GoogleProfile | null;
      }

      const mockRequest: MockAuthenticatedRequest = {
        user: null,
      };

      await expect(controller.googleAuthCallback(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.validateGoogleUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is undefined', async () => {
      interface MockAuthenticatedRequest {
        user?: GoogleProfile | null;
      }

      const mockRequest: MockAuthenticatedRequest = {};

      await expect(controller.googleAuthCallback(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

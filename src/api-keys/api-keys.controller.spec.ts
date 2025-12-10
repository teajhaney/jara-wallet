import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;

  const mockApiKeysService = {
    createApiKey: jest.fn(),
    rolloverApiKey: jest.fn(),
  };

  interface MockAuthenticatedRequest {
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }

  const mockRequest: MockAuthenticatedRequest = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should create API key successfully', async () => {
      const createDto: CreateApiKeyDto = {
        name: 'Test API Key',
        permissions: ['read', 'deposit'],
        expiry: '1D',
      };

      const mockResponse = {
        api_key: 'jara_api_test123456789',
        expires_at: new Date().toISOString(),
      };

      mockApiKeysService.createApiKey.mockResolvedValue(mockResponse);

      const result = await controller.createApiKey(mockRequest, createDto);

      expect(result).toEqual(mockResponse);
      expect(mockApiKeysService.createApiKey).toHaveBeenCalledWith(
        'user-123',
        createDto,
      );
    });
  });

  describe('rolloverApiKey', () => {
    it('should rollover API key successfully', async () => {
      const rolloverDto: RolloverApiKeyDto = {
        expired_key_id: 'key-123',
        expiry: '1M',
      };

      const mockResponse = {
        api_key: 'jara_api_new123456789',
        expires_at: new Date().toISOString(),
      };

      mockApiKeysService.rolloverApiKey.mockResolvedValue(mockResponse);

      const result = await controller.rolloverApiKey(mockRequest, rolloverDto);

      expect(result).toEqual(mockResponse);
      expect(mockApiKeysService.rolloverApiKey).toHaveBeenCalledWith(
        'user-123',
        rolloverDto,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealthCheck', () => {
    it('should return health check object with correct structure', () => {
      const result = appController.getHealthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('message');

      expect(result.status).toBe('healthy');
      expect(result.service).toBe('Jara Wallet API');
      expect(result.version).toBe('1.0.0');
      expect(result.message).toBe('API is running successfully');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('string');
      expect(result.uptime).toMatch(/^\d+[dhms](\s+\d+[dhms])*$/); // Matches format like "2m 36s" or "1d 2h 3m 4s"
    });

    it('should return valid ISO timestamp', () => {
      const result = appController.getHealthCheck();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.toISOString()).toBe(result.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return formatted uptime string', () => {
      const result = appController.getHealthCheck();

      expect(result.uptime).toBeTruthy();
      expect(typeof result.uptime).toBe('string');
      // Uptime should match pattern like "0s", "1m 30s", "2h 15m 30s", etc.
      expect(result.uptime).toMatch(/^(\d+[dhms](\s+)?)+$/);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';

describe('WalletService', () => {
  let service: WalletService;

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPaystackService = {
    initializeTransaction: jest.fn(),
    generateReference: jest.fn().mockReturnValue('JARA_1234567890_ABC123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaystackService,
          useValue: mockPaystackService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    const userId = 'user-123';
    const mockWallet = {
      id: 'wallet-123',
      userId,
      walletNumber: '1234567890123',
      balance: BigInt(0),
      createdAt: new Date(),
    };

    it('should create a wallet successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(mockWallet);

      const result = await service.createWallet(userId);

      expect(result).toEqual({
        id: mockWallet.id,
        userId: mockWallet.userId,
        walletNumber: mockWallet.walletNumber,
        balance: mockWallet.balance,
        createdAt: mockWallet.createdAt,
      });
      expect(mockPrismaService.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.wallet.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if wallet already exists', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.createWallet(userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.wallet.create).not.toHaveBeenCalled();
    });
  });

  describe('getWalletByUserId', () => {
    const userId = 'user-123';
    const mockWallet = {
      id: 'wallet-123',
      userId,
      walletNumber: '1234567890123',
      balance: BigInt(50000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return wallet for valid user ID', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWalletByUserId(userId);

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          userId: true,
          walletNumber: true,
          balance: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getWalletByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBalance', () => {
    const userId = 'user-123';
    const mockWallet = {
      balance: BigInt(50000),
    };

    it('should return balance in kobo and naira', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getBalance(userId);

      expect(result.balance).toBe('50000');
      expect(result.balanceInNaira).toBe(500);
    });
  });

  describe('initializeDeposit', () => {
    const userId = 'user-123';
    const amount = 1000; // 1000 Naira
    const mockWallet = {
      id: 'wallet-123',
      userId,
      walletNumber: '1234567890123',
      balance: BigInt(0),
    };
    const mockPaystackResponse = {
      authorization_url: 'https://checkout.paystack.com/xxx',
      reference: 'ref-123',
    };

    it('should initialize deposit successfully', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };
      const generatedReference = 'JARA_1234567890_ABC123';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPaystackService.generateReference.mockReturnValue(generatedReference);
      mockPaystackService.initializeTransaction.mockResolvedValue(
        mockPaystackResponse,
      );
      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-123',
        reference: generatedReference,
      });

      const result = await service.initializeDeposit(userId, amount);

      expect(result.authorization_url).toBe(
        mockPaystackResponse.authorization_url,
      );
      expect(result.reference).toBe(generatedReference); // Service returns the generated reference, not Paystack's
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, email: true },
      });
      expect(mockPaystackService.generateReference).toHaveBeenCalled();
      expect(mockPaystackService.initializeTransaction).toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    const userId = 'user-123';
    const recipientWalletNumber = '9876543210987';
    const amount = 500; // 500 Naira
    const mockSenderWallet = {
      id: 'wallet-123',
      userId,
      walletNumber: '1234567890123',
      balance: BigInt(100000), // 1000 Naira
    };
    const mockRecipientWallet = {
      id: 'wallet-456',
      userId: 'user-456',
      walletNumber: recipientWalletNumber,
      balance: BigInt(20000), // 200 Naira
    };

    it('should transfer funds successfully', async () => {
      const updatedSenderWallet = {
        ...mockSenderWallet,
        balance: BigInt(50000), // Updated balance after transfer
      };
      const updatedRecipientWallet = {
        ...mockRecipientWallet,
        balance: BigInt(70000), // Updated balance after receiving
      };
      const mockTransaction = {
        id: 'tx-123',
        userId,
        walletId: mockSenderWallet.id,
        type: 'TRANSFER',
        amount: BigInt(amount),
        status: 'SUCCESS',
        recipientWalletNumber,
        recipientWalletId: mockRecipientWallet.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.wallet.findUnique
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(mockRecipientWallet);

      // Mock transaction callback
      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            wallet: {
              update: jest
                .fn()
                .mockResolvedValueOnce(updatedSenderWallet)
                .mockResolvedValueOnce(updatedRecipientWallet),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(mockTransaction),
            },
          };
          return callback(tx);
        },
      );

      const result = await service.transfer(
        userId,
        recipientWalletNumber,
        amount,
      );

      expect(result.status).toBe('success');
      expect(result.message).toBe('Transfer completed');
      expect(result).toHaveProperty('senderTransactionId');
      expect(result).toHaveProperty('recipientTransactionId');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      const lowBalanceWallet = {
        ...mockSenderWallet,
        balance: BigInt(10000), // Only 100 Naira
      };
      const negativeBalanceWallet = {
        ...lowBalanceWallet,
        balance: BigInt(-40000), // Negative after transfer
      };

      mockPrismaService.wallet.findUnique
        .mockResolvedValueOnce(lowBalanceWallet)
        .mockResolvedValueOnce(mockRecipientWallet);

      // Mock transaction callback that returns negative balance
      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            wallet: {
              update: jest.fn().mockResolvedValueOnce(negativeBalanceWallet),
            },
            transaction: {
              create: jest.fn(),
            },
          };
          return callback(tx);
        },
      );

      await expect(
        service.transfer(userId, recipientWalletNumber, amount),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if recipient wallet not found', async () => {
      mockPrismaService.wallet.findUnique
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(null);

      await expect(
        service.transfer(userId, recipientWalletNumber, amount),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});

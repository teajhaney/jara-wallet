import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PaystackService } from './paystack.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

describe('WalletController', () => {
  let controller: WalletController;

  const mockWalletService = {
    getWalletByUserId: jest.fn(),
    getBalance: jest.fn(),
    initializeDeposit: jest.fn(),
    getTransactionStatus: jest.fn(),
    transfer: jest.fn(),
    getTransactionHistory: jest.fn(),
    updateTransactionFromWebhook: jest.fn(),
  };

  const mockPaystackService = {};

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key'),
  };

  interface MockAuthenticatedRequest {
    user: {
      id: string;
      email?: string;
      name?: string | null;
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
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: PaystackService,
          useValue: mockPaystackService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWallet', () => {
    it('should return wallet information', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        walletNumber: '1234567890123',
        balance: BigInt(50000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletService.getWalletByUserId.mockResolvedValue(mockWallet);

      const result = await controller.getWallet(mockRequest);

      expect(result).toEqual({
        id: mockWallet.id,
        userId: mockWallet.userId,
        walletNumber: mockWallet.walletNumber,
        balance: '50000',
        balanceInNaira: 500,
        createdAt: mockWallet.createdAt,
        updatedAt: mockWallet.updatedAt,
      });
      expect(mockWalletService.getWalletByUserId).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      mockWalletService.getBalance.mockResolvedValue({
        balance: '50000',
        balanceInNaira: 500,
      });

      const result = await controller.getBalance(mockRequest);

      expect(result).toEqual({
        balance: '50000',
        balanceInNaira: 500,
      });
      expect(mockWalletService.getBalance).toHaveBeenCalledWith('user-123');
    });
  });

  describe('initializeDeposit', () => {
    it('should initialize deposit successfully', async () => {
      const depositDto: DepositDto = { amount: 1000 };
      const mockResult = {
        authorization_url: 'https://checkout.paystack.com/xxx',
        reference: 'ref-123',
      };

      mockWalletService.initializeDeposit.mockResolvedValue(mockResult);

      const result = await controller.initializeDeposit(
        mockRequest,
        depositDto,
      );

      expect(result).toEqual({
        authorization_url: mockResult.authorization_url,
        reference: mockResult.reference,
        message:
          'Deposit initialized successfully. Redirect user to authorization_url to complete payment.',
      });
      expect(mockWalletService.initializeDeposit).toHaveBeenCalledWith(
        'user-123',
        depositDto.amount,
      );
    });
  });

  describe('getDepositStatus', () => {
    it('should return deposit status', async () => {
      const reference = 'ref-123';
      const mockStatus = {
        reference,
        status: 'SUCCESS',
        amount: '100000', // Service returns string
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletService.getTransactionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getDepositStatus(reference);

      expect(result).toEqual({
        reference: mockStatus.reference,
        status: mockStatus.status,
        amount: '100000',
        amountInNaira: 1000,
        createdAt: mockStatus.createdAt,
        updatedAt: mockStatus.updatedAt,
      });
      expect(mockWalletService.getTransactionStatus).toHaveBeenCalledWith(
        reference,
      );
    });
  });

  describe('transfer', () => {
    it('should transfer funds successfully', async () => {
      const transferDto: TransferDto = {
        wallet_number: '9876543210987',
        amount: 500,
      };
      const mockResult = {
        status: 'success',
        message: 'Transfer completed',
        senderTransactionId: 'tx-sender-123',
        recipientTransactionId: 'tx-recipient-456',
      };

      mockWalletService.transfer.mockResolvedValue(mockResult);

      const result = await controller.transfer(mockRequest, transferDto);

      expect(result).toEqual(mockResult);
      expect(mockWalletService.transfer).toHaveBeenCalledWith(
        'user-123',
        transferDto.wallet_number,
        transferDto.amount,
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'DEPOSIT',
          amount: '100000', // Service returns string
          status: 'SUCCESS',
          recipientWalletNumber: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tx-2',
          type: 'TRANSFER',
          amount: '50000', // Service returns string
          status: 'SUCCESS',
          recipientWalletNumber: '9876543210987',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWalletService.getTransactionHistory.mockResolvedValue(
        mockTransactions,
      );

      const result = await controller.getTransactionHistory(mockRequest);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tx-1',
        type: 'DEPOSIT',
        amount: '100000',
        amountInNaira: 1000,
        status: 'SUCCESS',
        recipientWalletNumber: null,
        metadata: null,
        createdAt: mockTransactions[0].createdAt,
        updatedAt: mockTransactions[0].updatedAt,
      });
      expect(mockWalletService.getTransactionHistory).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });
});

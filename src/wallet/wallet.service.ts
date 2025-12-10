import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
  ) {}

  // Generate a unique 13-digit wallet number

  private async generateUniqueWalletNumber(): Promise<string> {
    let walletNumber: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate a 13-digit wallet number (1000000000000 to 9999999999999)
      const randomPart = Math.floor(
        1000000000000 + Math.random() * 9000000000000,
      );
      walletNumber = randomPart.toString();

      // Ensure it's exactly 13 digits
      if (walletNumber.length !== 13) {
        continue;
      }

      // Check if wallet number already exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { walletNumber },
      });

      if (!existingWallet) {
        isUnique = true;
      }
    }

    return walletNumber;
  }

  //Create a wallet for a user
  //Auto-called when user is created to ensure a wallet is created for the user

  async createWallet(userId: string): Promise<{
    id: string;
    userId: string;
    walletNumber: string;
    balance: bigint;
    createdAt: Date;
  }> {
    // Check if wallet already exists
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    // Generate unique wallet number
    const walletNumber = await this.generateUniqueWalletNumber();

    // Create wallet with balance initialized to 0
    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        walletNumber,
        balance: BigInt(0), // Initialize balance to 0 in kobo
      },
    });

    return {
      id: wallet.id,
      userId: wallet.userId,
      walletNumber: wallet.walletNumber,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
    };
  }

  //Get wallet by user ID
  async getWalletByUserId(userId: string): Promise<{
    id: string;
    userId: string;
    walletNumber: string;
    balance: bigint;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const wallet = await this.prisma.wallet.findUnique({
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

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const result: {
      id: string;
      userId: string;
      walletNumber: string;
      balance: bigint;
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: wallet.id,
      userId: wallet.userId,
      walletNumber: wallet.walletNumber,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };

    return result;
  }

  //Get wallet by wallet number (for transfers)
  async getWalletByWalletNumber(walletNumber: string): Promise<{
    id: string;
    userId: string;
    walletNumber: string;
    balance: bigint;
  }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { walletNumber },
      select: {
        id: true,
        userId: true,
        walletNumber: true,
        balance: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const result: {
      id: string;
      userId: string;
      walletNumber: string;
      balance: bigint;
    } = {
      id: wallet.id,
      userId: wallet.userId,
      walletNumber: wallet.walletNumber,
      balance: wallet.balance,
    };

    return result;
  }

  //Ensure wallet exists for a user (idempotent)
  //Used when user is created to auto-create wallet
  async ensureWalletExists(userId: string): Promise<void> {
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!existingWallet) {
      await this.createWallet(userId);
    }
  }

  //Initialize a deposit transaction via Paystack
  //Creates a PENDING transaction and returns Paystack authorization URL
  async initializeDeposit(
    userId: string,
    amount: number,
  ): Promise<{
    authorization_url: string;
    reference: string;
  }> {
    // Validate amount (minimum 100 kobo = ₦1)
    if (amount < 100) {
      throw new BadRequestException('Amount must be at least ₦1 (100 kobo)');
    }

    // Get user to retrieve email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.email) {
      throw new BadRequestException('User email is required for deposit');
    }

    // Get user's wallet
    const wallet = await this.getWalletByUserId(userId);

    // Generate unique transaction reference
    // Retry if reference collision occurs (unlikely but possible)
    const maxAttempts = 5;
    let reference: string | undefined;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const candidateReference = this.paystackService.generateReference();

      // Check if reference already exists
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { reference: candidateReference },
      });

      if (!existingTransaction) {
        reference = candidateReference; // Reference is unique, proceed
        break;
      }
    }

    // TypeScript guard: ensure reference is defined
    if (!reference) {
      throw new BadRequestException(
        'Failed to generate unique transaction reference. Please try again.',
      );
    }

    // Initialize Paystack transaction
    const userEmail: string = user.email; // Type assertion after null check
    const paystackResponse = await this.paystackService.initializeTransaction(
      amount,
      userEmail,
      reference,
      {
        userId: userId,
        walletId: wallet.id,
        walletNumber: wallet.walletNumber,
      },
    );

    // Create transaction record as PENDING
    // Handle potential race condition where reference might be created between check and create
    try {
      await this.prisma.transaction.create({
        data: {
          userId: userId,
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount: BigInt(amount),
          status: 'PENDING',
          reference: reference,
          metadata: {
            paystackAccessCode: paystackResponse.access_code,
            paystackReference: paystackResponse.reference,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Handle unique constraint violation (P2002)
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Transaction reference already exists. Please try again.',
        );
      }
      throw error; // Re-throw other errors
    }

    return {
      authorization_url: paystackResponse.authorization_url,
      reference: reference,
    };
  }

  // Update transaction status from webhook
  // This method is called when Paystack sends a webhook notification.
  // It updates the transaction status in our database.

  async updateTransactionFromWebhook(
    reference: string,
    status: 'pending' | 'success' | 'failed',
    metadata?: Record<string, unknown>,
  ) {
    // Map lowercase status to TransactionStatus enum (uppercase)
    const statusMap: Record<
      'pending' | 'success' | 'failed',
      'PENDING' | 'SUCCESS' | 'FAILED'
    > = {
      pending: 'PENDING',
      success: 'SUCCESS',
      failed: 'FAILED',
    };

    const transactionStatus: 'PENDING' | 'SUCCESS' | 'FAILED' =
      statusMap[status];

    // Find transaction first to check type and current status
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { wallet: true },
    });

    if (!transaction) {
      console.warn('Transaction not found for reference:', reference);
      return;
    }

    // Check idempotency - avoid double-credit
    if (transaction.status === 'SUCCESS') {
      console.log('Transaction already processed, skipping:', reference);
      return;
    }

    // Use database transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Merge existing metadata with new metadata (preserve existing if no new metadata provided)
      const existingMetadata =
        (transaction.metadata as Record<string, unknown>) || {};
      const mergedMetadata = metadata
        ? { ...existingMetadata, ...metadata }
        : existingMetadata;

      // Update transaction status
      await tx.transaction.update({
        where: { reference },
        data: {
          status: transactionStatus,
          metadata: mergedMetadata as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });

      // If deposit is successful, credit wallet balance atomically
      if (transaction.type === 'DEPOSIT' && transactionStatus === 'SUCCESS') {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: transaction.amount, // Add amount in kobo
            },
          },
        });
      }
    });
  }

  //Get transaction status by reference (read-only)
  async getTransactionStatus(reference: string): Promise<{
    reference: string;
    status: string;
    amount: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference!,
      status: transaction.status,
      amount: transaction.amount.toString(),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  //Get wallet balance for a user
  async getBalance(userId: string): Promise<{
    balance: string;
    balanceInNaira: number;
  }> {
    const wallet = await this.getWalletByUserId(userId);

    return {
      balance: wallet.balance.toString(),
      balanceInNaira: Number(wallet.balance) / 100, // Convert kobo to naira
    };
  }

  //Transfer funds from one wallet to another
  //Uses database transaction to ensure atomicity
  async transfer(
    senderUserId: string,
    recipientWalletNumber: string,
    amount: number,
  ): Promise<{
    status: string;
    message: string;
    senderTransactionId: string;
    recipientTransactionId: string;
  }> {
    // Validate amount (minimum 100 kobo = ₦1)
    if (amount < 100) {
      throw new BadRequestException('Amount must be at least ₦1 (100 kobo)');
    }

    // Get sender's wallet
    const senderWallet = await this.getWalletByUserId(senderUserId);

    // Check sufficient balance
    if (senderWallet.balance < BigInt(amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // Prevent self-transfer
    if (senderWallet.walletNumber === recipientWalletNumber) {
      throw new BadRequestException('Cannot transfer to your own wallet');
    }

    // Find recipient wallet by wallet number
    const recipientWallet = await this.getWalletByWalletNumber(
      recipientWalletNumber,
    );

    // Prevent transfer to same user (if they have multiple wallets - edge case)
    if (recipientWallet.userId === senderUserId) {
      throw new BadRequestException('Cannot transfer to your own wallet');
    }

    // Perform transfer atomically using database transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Debit sender balance
      const updatedSenderWallet = await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: {
            decrement: BigInt(amount),
          },
        },
      });

      // Verify sender still has sufficient balance (double-check)
      if (updatedSenderWallet.balance < BigInt(0)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Credit recipient balance
      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: {
            increment: BigInt(amount),
          },
        },
      });

      // Create sender transaction record (TRANSFER out)
      const senderTransaction = await tx.transaction.create({
        data: {
          userId: senderUserId,
          walletId: senderWallet.id,
          type: 'TRANSFER',
          amount: BigInt(amount),
          status: 'SUCCESS',
          recipientWalletNumber: recipientWalletNumber,
          recipientWalletId: recipientWallet.id,
        },
      });

      // Create recipient transaction record (TRANSFER in)
      const recipientTransaction = await tx.transaction.create({
        data: {
          userId: recipientWallet.userId,
          walletId: recipientWallet.id,
          type: 'TRANSFER',
          amount: BigInt(amount),
          status: 'SUCCESS',
          recipientWalletNumber: recipientWalletNumber,
          recipientWalletId: recipientWallet.id,
        },
      });

      return {
        senderTransactionId: senderTransaction.id,
        recipientTransactionId: recipientTransaction.id,
      };
    });

    return {
      status: 'success',
      message: 'Transfer completed',
      senderTransactionId: result.senderTransactionId,
      recipientTransactionId: result.recipientTransactionId,
    };
  }

  //Get transaction history for a user's wallet
  async getTransactionHistory(userId: string): Promise<
    Array<{
      id: string;
      type: string;
      amount: string;
      status: string;
      recipientWalletNumber: string | null;
      metadata: any;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    // Get user's wallet
    const wallet = await this.getWalletByUserId(userId);

    // Query transactions for this wallet
    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        recipientWalletNumber: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: Array<{
      id: string;
      type: string;
      amount: string;
      status: string;
      recipientWalletNumber: string | null;
      metadata: any;
      createdAt: Date;
      updatedAt: Date;
    }> = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      status: tx.status,
      recipientWalletNumber: tx.recipientWalletNumber,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    }));

    return result;
  }
}

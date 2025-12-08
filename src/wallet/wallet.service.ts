import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique 13-digit wallet number
   */
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

  /**
   * Create a wallet for a user
   * Auto-called when user is created
   */
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

  /**
   * Get wallet by user ID
   */
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

  /**
   * Get wallet by wallet number (for transfers)
   */
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

  /**
   * Ensure wallet exists for a user (idempotent)
   * Used when user is created to auto-create wallet
   */
  async ensureWalletExists(userId: string): Promise<void> {
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!existingWallet) {
      await this.createWallet(userId);
    }
  }
}

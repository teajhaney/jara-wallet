import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { WalletService } from './wallet.service';
import { CombinedAuthGuard } from '../api-keys/guards/combined-auth.guard';
import { PermissionsGuard } from '../api-keys/guards/permissions.guard';
import { Permissions } from '../api-keys/decorators/permissions.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email?: string;
    name?: string | null;
  };
}

@Controller('wallet')
@UseGuards(CombinedAuthGuard, PermissionsGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('read') // Requires 'read' permission for API keys, JWT users bypass
  async getWallet(@Request() req: AuthenticatedRequest) {
    const userId: string = req.user.id;
    const wallet = await this.walletService.getWalletByUserId(userId);

    // Convert BigInt balance to string for JSON serialization
    return {
      id: wallet.id,
      userId: wallet.userId,
      walletNumber: wallet.walletNumber,
      balance: wallet.balance.toString(), // Convert BigInt to string
      balanceInNaira: Number(wallet.balance) / 100, // Convert kobo to naira for display
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}

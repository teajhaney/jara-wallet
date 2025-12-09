import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { WalletService } from './wallet.service';
import { PaystackService } from './paystack.service';
import { CombinedAuthGuard } from '../api-keys/guards/combined-auth.guard';
import { PermissionsGuard } from '../api-keys/guards/permissions.guard';
import { Permissions } from '../api-keys/decorators/permissions.decorator';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { verifyPaystackWebhook } from './paystack-webhook.util';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email?: string;
    name?: string | null;
  };
}

@Controller('wallet')
export class WalletController {
  private readonly secretKey: string | undefined;

  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
    private readonly configService: ConfigService,
  ) {
    // Load webhook secret from configuration
    this.secretKey = this.configService.get<string>('paystack.secretKey');

    if (!this.secretKey) {
      console.warn(
        'Paystack secret is not configured. Webhook verification will fail.',
      );
    }
  }

  @Get()
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
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

  @Post('deposit')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @Permissions('deposit') // Requires 'deposit' permission for API keys, JWT users bypass
  async initializeDeposit(
    @Request() req: AuthenticatedRequest,
    @Body() depositDto: DepositDto,
  ) {
    const userId: string = req.user.id;
    const result = await this.walletService.initializeDeposit(
      userId,
      depositDto.amount,
    );

    return {
      authorization_url: result.authorization_url,
      reference: result.reference,
      message:
        'Deposit initialized successfully. Redirect user to authorization_url to complete payment.',
    };
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(
    @Request() req: RawBodyRequest<ExpressRequest>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const payload = JSON.stringify(req.body);

    if (this.secretKey && signature) {
      const isValid = verifyPaystackWebhook(payload, signature, this.secretKey);

      if (!isValid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else if (this.secretKey && !signature) {
      // Secret is configured but no signature provided - this is suspicious
      throw new BadRequestException('Missing Paystack signature header');
    } else {
      // No secret configured - this is OK for test mode
      console.warn(
        '⚠️  Webhook secret not configured - skipping signature verification (OK for test mode)',
      );
    }

    try {
      // Parse webhook event
      const event = req.body as {
        event: string;
        data: {
          reference: string;
          status: string;
          amount: number;
        };
      };

      console.log('Received Paystack webhook event:', event.event);

      // Paystack sends different event types
      if (event.event === 'charge.success' || event.event === 'charge.failed') {
        const transactionData = event.data;

        // Map Paystack status to our status format
        let status: 'pending' | 'success' | 'failed' = 'pending';
        if (event.event === 'charge.success') {
          status = 'success';
        } else if (event.event === 'charge.failed') {
          status = 'failed';
        }

        console.log(
          `Updating transaction ${transactionData.reference} to status: ${status}`,
        );

        // Update transaction in database
        await this.walletService.updateTransactionFromWebhook(
          transactionData.reference,
          status,
        );

        console.log(
          `Successfully updated transaction ${transactionData.reference}`,
        );
      } else {
        console.log(`Unhandled webhook event type: ${event.event}`);
      }

      return { status: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }

  @Get('deposit/:reference/status')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @Permissions('read') // Requires 'read' permission for API keys, JWT users bypass
  async getDepositStatus(@Param('reference') reference: string) {
    const status = await this.walletService.getTransactionStatus(reference);

    return {
      reference: status.reference,
      status: status.status,
      amount: status.amount,
      amountInNaira: Number(status.amount) / 100, // Convert kobo to naira
      createdAt: status.createdAt,
      updatedAt: status.updatedAt,
    };
  }

  @Get('balance')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @Permissions('read') // Requires 'read' permission for API keys, JWT users bypass
  async getBalance(@Request() req: AuthenticatedRequest) {
    const userId: string = req.user.id;
    const balance = await this.walletService.getBalance(userId);

    return {
      balance: balance.balance,
      balanceInNaira: balance.balanceInNaira,
    };
  }

  @Post('transfer')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @Permissions('transfer') // Requires 'transfer' permission for API keys, JWT users bypass
  async transfer(
    @Request() req: AuthenticatedRequest,
    @Body() transferDto: TransferDto,
  ) {
    const userId: string = req.user.id;
    const result = await this.walletService.transfer(
      userId,
      transferDto.wallet_number,
      transferDto.amount,
    );

    return result;
  }

  @Get('transactions')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @Permissions('read') // Requires 'read' permission for API keys, JWT users bypass
  async getTransactionHistory(@Request() req: AuthenticatedRequest) {
    const userId: string = req.user.id;
    const transactions = await this.walletService.getTransactionHistory(userId);

    // Format transactions for response
    return transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      amountInNaira: Number(tx.amount) / 100, // Convert kobo to naira
      status: tx.status,
      recipientWalletNumber: tx.recipientWalletNumber,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    }));
  }
}

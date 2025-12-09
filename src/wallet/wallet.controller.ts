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
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { WalletService } from './wallet.service';
import { PaystackService } from './paystack.service';
import { CombinedAuthGuard } from '../api-keys/guards/combined-auth.guard';
import { PermissionsGuard } from '../api-keys/guards/permissions.guard';
import { Permissions } from '../api-keys/decorators/permissions.decorator';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email?: string;
    name?: string | null;
  };
}

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

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
    @Body() body: any,
  ) {
    // Get raw body as string for signature verification
    // Paystack requires the exact JSON stringified body for signature verification
    const rawBodyString: string =
      req.rawBody?.toString('utf8') || JSON.stringify(body || req.body);

    // Verify webhook signature using PAYSTACK_SECRET_KEY (as per Paystack docs)
    if (!signature) {
      throw new UnauthorizedException('Missing Paystack signature');
    }

    const isValid = this.paystackService.verifyWebhookSignature(
      rawBodyString,
      signature,
    );

    if (!isValid) {
      console.error('Webhook signature verification failed', {
        receivedSignature: signature.substring(0, 20) + '...',
        payloadLength: rawBodyString.length,
        payloadPreview: rawBodyString.substring(0, 100),
      });
      throw new UnauthorizedException('Invalid Paystack signature');
    }

    // Parse webhook payload
    const event = (body || req.body) as {
      event: string;
      data: {
        reference: string;
        status: string;
        amount: number;
      };
    };

    console.log('Received Paystack webhook:', {
      event: event.event,
      reference: event.data?.reference,
      status: event.data?.status,
    });

    // Handle webhook event
    // Always return 200 OK to prevent Paystack retries
    // Errors are logged internally, not thrown
    try {
      await this.walletService.handlePaystackWebhook(event);
    } catch (error) {
      // Log error but still return 200 OK
      // This prevents Paystack from retrying the webhook indefinitely
      console.error('Error processing webhook (returning 200 OK):', {
        error: error instanceof Error ? error.message : String(error),
        reference: event.data?.reference,
      });
    }

    // Always return success response to Paystack
    // This marks the webhook as successfully delivered
    return { status: true };
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

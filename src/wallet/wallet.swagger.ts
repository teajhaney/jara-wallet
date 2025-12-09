import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import {
  WalletResponseDto,
  DepositInitResponseDto,
  BalanceResponseDto,
  TransactionStatusResponseDto,
  TransactionHistoryItemDto,
  TransferResponseDto,
} from './dto/wallet-response.dto';

export const ApiWalletTag = () => ApiTags('wallet');

export const ApiGetWallet = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get user wallet' }),
    ApiBearerAuth('JWT-auth'),
    ApiSecurity('API-Key'),
    ApiResponse({ status: 200, type: WalletResponseDto }),
    ApiResponse({ status: 401 }),
  );

export const ApiInitializeDeposit = () =>
  applyDecorators(
    ApiOperation({ summary: 'Initialize deposit' }),
    ApiBearerAuth('JWT-auth'),
    ApiSecurity('API-Key'),
    ApiResponse({ status: 200, type: DepositInitResponseDto }),
    ApiResponse({ status: 400 }),
    ApiResponse({ status: 401 }),
  );

export const ApiExcludeWebhook = () => ApiExcludeEndpoint();

export const ApiGetDepositStatus = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get deposit status' }),
    ApiBearerAuth('JWT-auth'),
    ApiSecurity('API-Key'),
    ApiParam({ name: 'reference', example: 'TXN1234567890' }),
    ApiResponse({ status: 200, type: TransactionStatusResponseDto }),
    ApiResponse({ status: 401 }),
    ApiResponse({ status: 404 }),
  );

export const ApiGetBalance = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get wallet balance' }),
    ApiBearerAuth('JWT-auth'),
    ApiSecurity('API-Key'),
    ApiResponse({ status: 200, type: BalanceResponseDto }),
    ApiResponse({ status: 401 }),
  );

export const ApiTransfer = () =>
  applyDecorators(
    ApiOperation({ summary: 'Transfer funds' }),
    ApiBearerAuth('JWT-auth'),
    ApiSecurity('API-Key'),
    ApiResponse({ status: 200, type: TransferResponseDto }),
    ApiResponse({ status: 400 }),
    ApiResponse({ status: 401 }),
    ApiResponse({ status: 404 }),
  );

export const ApiGetTransactionHistory = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get transaction history' }),
    ApiBearerAuth('JWT-auth'),
    ApiSecurity('API-Key'),
    ApiResponse({ status: 200, type: [TransactionHistoryItemDto] }),
    ApiResponse({ status: 401 }),
  );

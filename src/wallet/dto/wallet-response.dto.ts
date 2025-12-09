import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({ description: 'Wallet ID', example: 'clx1234567890' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'clx1234567890' })
  userId: string;

  @ApiProperty({
    description: '13-digit wallet number',
    example: '1234567890123',
  })
  walletNumber: string;

  @ApiProperty({
    description: 'Balance in kobo',
    example: '5000000',
  })
  balance: string;

  @ApiProperty({
    description: 'Balance in Naira',
    example: 50000,
  })
  balanceInNaira: number;

  @ApiProperty({
    description: 'Wallet creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Wallet last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class DepositInitResponseDto {
  @ApiProperty({
    description: 'Paystack authorization URL',
    example: 'https://checkout.paystack.com/xxxxx',
  })
  authorization_url: string;

  @ApiProperty({
    description: 'Transaction reference',
    example: 'TXN1234567890',
  })
  reference: string;

  @ApiProperty({
    description: 'Success message',
    example:
      'Deposit initialized successfully. Redirect user to authorization_url to complete payment.',
  })
  message: string;
}

export class BalanceResponseDto {
  @ApiProperty({
    description: 'Balance in kobo',
    example: '5000000',
  })
  balance: string;

  @ApiProperty({
    description: 'Balance in Naira',
    example: 50000,
  })
  balanceInNaira: number;
}

export class TransactionStatusResponseDto {
  @ApiProperty({
    description: 'Transaction reference',
    example: 'TXN1234567890',
  })
  reference: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: ['pending', 'success', 'failed'],
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Transaction amount in kobo',
    example: '5000000',
  })
  amount: string;

  @ApiProperty({
    description: 'Transaction amount in Naira',
    example: 50000,
  })
  amountInNaira: number;

  @ApiProperty({
    description: 'Transaction creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Transaction last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class TransactionHistoryItemDto {
  @ApiProperty({ description: 'Transaction ID', example: 'clx1234567890' })
  id: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['deposit', 'transfer', 'withdrawal'],
    example: 'deposit',
  })
  type: string;

  @ApiProperty({
    description: 'Transaction amount in kobo',
    example: '5000000',
  })
  amount: string;

  @ApiProperty({
    description: 'Transaction amount in Naira',
    example: 50000,
  })
  amountInNaira: number;

  @ApiProperty({
    description: 'Transaction status',
    enum: ['pending', 'success', 'failed'],
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Recipient wallet number (for transfers)',
    example: '1234567890123',
    nullable: true,
  })
  recipientWalletNumber: string | null;

  @ApiProperty({
    description: 'Transaction metadata',
    example: { reference: 'TXN1234567890' },
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Transaction creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Transaction last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class TransferResponseDto {
  @ApiProperty({
    description: 'Transaction reference',
    example: 'TXN1234567890',
  })
  reference: string;

  @ApiProperty({
    description: 'Transfer status',
    enum: ['pending', 'success', 'failed'],
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Transfer amount in kobo',
    example: '5000000',
  })
  amount: string;

  @ApiProperty({
    description: 'Recipient wallet number',
    example: '1234567890123',
  })
  recipientWalletNumber: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Transfer completed successfully',
  })
  message: string;
}

export class WebhookResponseDto {
  @ApiProperty({
    description: 'Webhook processing status',
    example: true,
  })
  status: boolean;
}

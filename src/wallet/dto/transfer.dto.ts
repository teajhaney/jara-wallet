import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: '13-digit wallet number of recipient',
    example: '1234567890123',
  })
  @IsString({ message: 'wallet_number must be a string' })
  @IsNotEmpty({ message: 'wallet_number is required' })
  wallet_number: string; // 13-digit wallet number of recipient

  @ApiProperty({
    description: 'Amount to transfer in kobo (e.g., 50000 = ₦500)',
    example: 50000,
    minimum: 100,
  })
  @IsNumber({}, { message: 'amount must be a number' })
  @IsNotEmpty({ message: 'amount is required' })
  @Min(100, { message: 'amount must be at least ₦1 (100 kobo)' })
  amount: number; // Amount in kobo (e.g., 50000 = ₦500)
}

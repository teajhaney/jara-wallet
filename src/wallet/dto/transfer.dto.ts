import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class TransferDto {
  @IsString({ message: 'wallet_number must be a string' })
  @IsNotEmpty({ message: 'wallet_number is required' })
  wallet_number: string; // 13-digit wallet number of recipient

  @IsNumber({}, { message: 'amount must be a number' })
  @IsNotEmpty({ message: 'amount is required' })
  @Min(100, { message: 'amount must be at least ₦1 (100 kobo)' })
  amount: number; // Amount in kobo (e.g., 50000 = ₦500)
}

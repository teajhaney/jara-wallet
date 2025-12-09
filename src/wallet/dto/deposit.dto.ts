import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class DepositDto {
  @IsNumber({}, { message: 'amount must be a number' })
  @IsNotEmpty({ message: 'amount is required' })
  @Min(100, { message: 'amount must be at least ₦1 (100 kobo)' })
  amount: number; // Amount in kobo (e.g., 50000 = ₦500)
}

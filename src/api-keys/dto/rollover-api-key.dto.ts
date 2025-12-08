import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class RolloverApiKeyDto {
  @IsString({ message: 'expired_key_id must be a string' })
  @IsNotEmpty({ message: 'expired_key_id is required' })
  expired_key_id: string;

  @IsString({ message: 'expiry must be a string' })
  @IsNotEmpty({ message: 'expiry is required' })
  @IsIn(['1H', '1D', '1M', '1Y'], {
    message: 'expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}

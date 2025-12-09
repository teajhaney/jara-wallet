import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'ID of the expired API key to rollover',
    example: 'clx1234567890',
  })
  @IsString({ message: 'expired_key_id must be a string' })
  @IsNotEmpty({ message: 'expired_key_id is required' })
  expired_key_id: string;

  @ApiProperty({
    description: 'Expiry duration for the new API key',
    enum: ['1H', '1D', '1M', '1Y'],
    example: '1M',
  })
  @IsString({ message: 'expiry must be a string' })
  @IsNotEmpty({ message: 'expiry is required' })
  @IsIn(['1H', '1D', '1M', '1Y'], {
    message: 'expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}

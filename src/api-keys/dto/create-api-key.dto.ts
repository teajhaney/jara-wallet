import {
  IsString,
  IsArray,
  IsIn,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Name for the API key',
    example: 'My API Key',
  })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiProperty({
    description: 'Array of permissions for the API key',
    example: ['read', 'deposit', 'transfer'],
    type: [String],
  })
  @IsArray({ message: 'permissions must be an array' })
  @ArrayMinSize(1, {
    message: 'permissions must contain at least one permission',
  })
  @IsString({ each: true, message: 'Each permission must be a string' })
  @IsNotEmpty({ message: 'permissions is required' })
  permissions: string[];

  @ApiProperty({
    description: 'Expiry duration',
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

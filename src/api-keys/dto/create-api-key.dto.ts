import {
  IsString,
  IsArray,
  IsIn,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsArray({ message: 'permissions must be an array' })
  @ArrayMinSize(1, {
    message: 'permissions must contain at least one permission',
  })
  @IsString({ each: true, message: 'Each permission must be a string' })
  @IsNotEmpty({ message: 'permissions is required' })
  permissions: string[];

  @IsString({ message: 'expiry must be a string' })
  @IsNotEmpty({ message: 'expiry is required' })
  @IsIn(['1H', '1D', '1M', '1Y'], {
    message: 'expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}

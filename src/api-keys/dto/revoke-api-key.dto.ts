import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeApiKeyDto {
  @ApiProperty({
    description: 'ID of the API key to revoke',
    example: 'clx1234567890',
  })
  @IsString({ message: 'api_key_id must be a string' })
  @IsNotEmpty({ message: 'api_key_id is required' })
  api_key_id: string;
}


import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'The API key (only shown once)',
    example: 'jara_live_1234567890abcdef1234567890abcdef',
  })
  api_key: string;

  @ApiProperty({
    description: 'Expiration date in ISO format',
    example: '2024-12-31T23:59:59.000Z',
  })
  expires_at: string;
}

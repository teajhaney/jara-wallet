import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyListItemDto {
  @ApiProperty({
    description: 'API key ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'API key name',
    example: 'My API Key',
  })
  name: string;

  @ApiProperty({
    description: 'Full API key (can be used for authentication)',
    example: 'jara_api_key_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  })
  key: string;

  @ApiProperty({
    description: 'API key prefix (for display purposes)',
    example: 'jara_api_key_abc123xxxxx',
  })
  keyPrefix: string;

  @ApiProperty({
    description: 'API key permissions',
    example: ['read', 'deposit', 'transfer'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Expiration date',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Whether the API key is revoked',
    example: false,
  })
  revoked: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description:
      'Whether the API key is currently active (not expired and not revoked)',
    example: true,
  })
  isActive: boolean;
}

import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetApiKeysQueryDto {
  @ApiPropertyOptional({
    description: 'Filter API keys by status',
    enum: ['active', 'revoked', 'all'],
    example: 'active',
    default: 'all',
  })
  @IsOptional()
  @IsIn(['active', 'revoked', 'all'], {
    message: 'status must be one of: active, revoked, all',
  })
  status?: 'active' | 'revoked' | 'all' = 'all';
}

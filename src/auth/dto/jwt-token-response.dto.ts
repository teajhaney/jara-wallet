import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 'clx1234567890' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    nullable: true,
  })
  name: string | null;
}

export class JwtTokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  })
  access_token: string;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Success message',
    example: 'Authentication successful',
  })
  message?: string;
}

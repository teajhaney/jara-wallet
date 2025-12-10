import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtTokenResponseDto } from './dto/jwt-token-response.dto';

export const ApiAuthTag = () => ApiTags('auth');

export const ApiGoogleAuth = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Initiate Google OAuth authentication',
      description: `**⚠️ IMPORTANT: Do NOT use the "Try it out" button in Swagger or any API client for this endpoint.**

**Click the links below in your browser to start Google Sign-In:**

🔗 **Production**: [https://jara-wallet.vercel.app/auth/google](https://jara-wallet.vercel.app/auth/google)

🔗 **Local**: [http://localhost:3000/auth/google](http://localhost:3000/auth/google)

This endpoint redirects you to Google OAuth consent screen. After authentication, you will be redirected to \`/auth/google/callback\` which returns a JWT token.

**Note**: This endpoint requires browser-based OAuth flow and will not work when executed from Swagger UI or API clients.`,
    }),
    ApiResponse({
      status: 302,
      description: 'Redirects to Google OAuth consent screen',
    }),
  );

export const ApiGoogleAuthCallback = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Google OAuth callback',
      description: `**⚠️ This endpoint is called automatically by Google after authentication.**

**Do NOT use the "Try it out" button** - this endpoint requires the complete Google OAuth flow and will not work from Swagger UI or API clients.

After clicking the Google Sign-In links above, Google will automatically redirect you to this endpoint, and you'll receive a JWT token in the response.

**This endpoint is for reference only** - use the links in the \`/auth/google\` endpoint above to authenticate.`,
    }),
    ApiResponse({
      status: 200,
      description: 'Authentication successful',
      type: JwtTokenResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Authentication failed - user not found in request',
    }),
  );

import {
  Controller,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type {
  AuthenticatedRequest,
  GoogleProfile,
  JwtTokenResponse,
} from './types/auth.types';
import {
  ApiAuthTag,
  ApiGoogleAuth,
  ApiGoogleAuthCallback,
} from './auth.swagger';

@ApiAuthTag()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuth()
  async googleAuth() {
    // This will redirect to Google OAuth consent screen
    // The guard handles the redirect automatically
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuthCallback()
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
  ): Promise<JwtTokenResponse> {
    // After Google authentication, Passport populates req.user
    if (!req.user) {
      throw new UnauthorizedException('User not found in request');
    }

    const googleProfile: GoogleProfile = req.user;

    // Validate and create/find user
    const user = await this.authService.validateGoogleUser(googleProfile);

    // Generate JWT token (synchronous method, no await needed)
    const tokenData = this.authService.generateJwtToken(user);

    // Return JWT token and user data
    return {
      access_token: tokenData.access_token,
      user: tokenData.user,
      message: 'Authentication successful',
    };
  }
}

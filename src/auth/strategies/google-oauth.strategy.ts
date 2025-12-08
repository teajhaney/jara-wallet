import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import type { GoogleOAuthProfile, GoogleProfile } from '../types/auth.types';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('google.clientId');
    const clientSecret = configService.get<string>('google.clientSecret');
    const callbackURL = configService.get<string>('google.redirectUri');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Google OAuth configuration is incomplete. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleOAuthProfile,
    done: VerifyCallback,
  ): void {
    if (!profile.id) {
      done(new Error('Profile ID is missing'), undefined);
      return;
    }

    if (!profile.emails || profile.emails.length === 0) {
      done(new Error('Profile email is missing'), undefined);
      return;
    }

    const givenName = profile.name?.givenName || '';
    const familyName = profile.name?.familyName || '';
    const fullName =
      `${givenName} ${familyName}`.trim() || profile.displayName || '';

    const user: GoogleProfile = {
      googleId: profile.id,
      email: profile.emails[0].value,
      name: fullName,
      accessToken,
    };

    done(undefined, user);
  }
}

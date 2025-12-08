import type { Profile } from 'passport-google-oauth20';
import type { User } from '@prisma/client';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string | null;
}

export interface JwtTokenResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  message?: string;
}

export interface GoogleOAuthProfile extends Omit<Profile, 'emails' | 'name'> {
  id: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{
    value: string;
    verified?: boolean;
  }>;
}

export type PrismaUser = User;

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import type {
  GoogleProfile,
  JwtPayload,
  JwtTokenResponse,
  PrismaUser,
} from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private walletService: WalletService,
  ) {}

  async validateGoogleUser(googleProfile: GoogleProfile): Promise<PrismaUser> {
    const { googleId, email, name } = googleProfile;

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      // Check if user exists by email (edge case: user signed up differently)
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Update existing user with googleId
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { googleId },
        });

        // Ensure wallet exists for existing user
        const userId: string = user.id;
        await this.walletService.ensureWalletExists(userId);
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            googleId,
            email,
            name,
          },
        });

        // Auto-create wallet for new user
        const userId: string = user.id;
        await this.walletService.createWallet(userId);
      }
    }

    return user;
  }

  generateJwtToken(user: PrismaUser): JwtTokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}

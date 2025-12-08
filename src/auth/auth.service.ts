import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
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
        const existingWallet = await this.prisma.wallet.findUnique({
          where: { userId: user.id },
        });

        if (!existingWallet) {
          const walletNumber = await this.generateUniqueWalletNumber();
          await this.prisma.wallet.create({
            data: {
              userId: user.id,
              walletNumber,
            },
          });
        }
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            googleId,
            email,
            name,
          },
        });

        // Create wallet for new user with unique wallet number
        const walletNumber = await this.generateUniqueWalletNumber();
        await this.prisma.wallet.create({
          data: {
            userId: user.id,
            walletNumber,
          },
        });
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

  private async generateUniqueWalletNumber(): Promise<string> {
    // Generate a 13-digit wallet number and ensure it's unique
    let walletNumber: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate a 13-digit wallet number
      const randomPart = Math.floor(
        1000000000000 + Math.random() * 9000000000000,
      );
      walletNumber = randomPart.toString();

      // Check if wallet number already exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { walletNumber },
      });

      if (!existingWallet) {
        isUnique = true;
      }
    }

    return walletNumber;
  }
}

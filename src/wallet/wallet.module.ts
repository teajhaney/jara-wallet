import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PaystackService } from './paystack.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule, // For Paystack configuration
    forwardRef(() => ApiKeysModule),
  ],
  controllers: [WalletController],
  providers: [WalletService, PaystackService],
  exports: [WalletService, PaystackService], // Export for use in other modules
})
export class WalletModule {}

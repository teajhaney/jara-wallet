import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ApiKeysModule)],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService], // Export for use in other modules (e.g., auth module)
})
export class WalletModule {}

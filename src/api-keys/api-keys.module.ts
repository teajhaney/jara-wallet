import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CombinedAuthGuard } from './guards/combined-auth.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), PassportModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, CombinedAuthGuard],
  exports: [ApiKeysService, CombinedAuthGuard], // Export for use in other modules (e.g., wallet module)
})
export class ApiKeysModule {}

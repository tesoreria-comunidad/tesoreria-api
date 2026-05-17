import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule, AuthModule],
  controllers: [BalanceController],
  providers: [
    UserService,
    BalanceService,
    JwtService,
    PrismaService,
  ],
  exports: [BalanceService],
})
export class BalanceModule {}

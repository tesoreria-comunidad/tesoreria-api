import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [BalanceController],
  providers: [
    UserService,
    BalanceService,
    AuthService,
    JwtService,
    PrismaService,
  ],
  exports: [BalanceService],
})
export class BalanceModule {}

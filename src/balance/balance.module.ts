import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [BalanceController],
  providers: [UserService, BalanceService, AuthService, JwtService],
  exports: [BalanceService],
})
export class BalanceModule {}

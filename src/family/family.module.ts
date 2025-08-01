import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { BalanceModule } from 'src/balance/balance.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [BalanceModule],
  controllers: [FamilyController],
  providers: [
    FamilyService,
    UserService,
    AuthService,
    PrismaService,
    JwtService,
  ],
})
export class FamilyModule {}

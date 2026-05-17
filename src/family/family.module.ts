import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { BalanceModule } from 'src/balance/balance.module';
import { UserService } from 'src/user/user.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [BalanceModule, ServicesModule, AuthModule],
  controllers: [FamilyController],
  providers: [
    FamilyService,
    UserService,
    PrismaService,
    JwtService,
  ],
})
export class FamilyModule {}

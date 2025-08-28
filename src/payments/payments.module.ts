import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from 'src/prisma.service';
import { FamilyService } from 'src/family/family.service';
import { BalanceService } from 'src/balance/balance.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [PaymentsController],
  providers: [
    UserService,
    PaymentsService,
    PrismaService,
    AuthService,
    JwtService,
    FamilyService,
    BalanceService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from 'src/prisma.service';
import { FamilyService } from 'src/family/family.service';
import { BalanceService } from 'src/balance/balance.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, FamilyService, BalanceService],
})
export class PaymentsModule { }

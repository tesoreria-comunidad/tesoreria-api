import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { AuthModule } from 'src/auth/auth.module';
import { FamilyModule } from 'src/family/family.module';
import { UserModule } from 'src/user/user.module';
import { BalanceModule } from 'src/balance/balance.module';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [AuthModule, FamilyModule, UserModule, BalanceModule, ServicesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService],
})
export class TransactionsModule {}

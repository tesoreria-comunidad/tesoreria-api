import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaService } from 'src/prisma.service';
import { BalanceModule } from 'src/balance/balance.module';

@Module({
  imports: [BalanceModule],
  controllers: [FamilyController],
  providers: [FamilyService, PrismaService],
})
export class FamilyModule { }

import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { CronJobsController } from './cron-jobs.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { BalanceService } from 'src/balance/balance.service';
import { RoleFilterService } from 'src/services/RoleFilter.service';

@Module({
  imports: [
    AuthModule,
    UserModule, // Necesario para el AuthGuard
  ],
  controllers: [CronJobsController],
  providers: [
    CronJobsService,
    PrismaService,
    BalanceService,
    RoleFilterService,
  ],
  exports: [CronJobsService],
})
export class CronJobsModule {}

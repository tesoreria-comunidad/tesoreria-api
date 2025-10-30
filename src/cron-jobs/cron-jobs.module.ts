import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { CronJobsController } from './cron-jobs.controller';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { BalanceModule } from 'src/balance/balance.module';

@Module({
  imports: [
    AuthModule,
    UserModule, // Necesario para el AuthGuard
    PrismaModule,
    BalanceModule,
  ],
  controllers: [CronJobsController],
  providers: [CronJobsService],
  exports: [CronJobsService],
})
export class CronJobsModule {}

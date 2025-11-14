import { Module, forwardRef } from '@nestjs/common';
import { ActionLogsController } from './action-logs.controller';
import { ActionLogsService } from './action-logs.service';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ActionLogsController],
  providers: [ActionLogsService, PrismaService],
  exports: [ActionLogsService],
})
export class ActionLogsModule {}

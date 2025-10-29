import { Module } from '@nestjs/common';
import { ActionLogsController } from './action-logs.controller';
import { ActionLogsService } from './action-logs.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ActionLogsController],
  providers: [ActionLogsService, PrismaService],
  exports: [ActionLogsService],
})
export class ActionLogsModule {}

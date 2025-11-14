import { Module, forwardRef } from '@nestjs/common';
import { RoleFilterService } from './RoleFilter.service';
import { ActionLogsModule } from 'src/action-logs/action-logs.module';
import { ActionLogsService } from 'src/action-logs/action-logs.service';

@Module({
  imports: [forwardRef(() => ActionLogsModule)],
  providers: [RoleFilterService],
  exports: [RoleFilterService, ActionLogsModule],
})
export class ServicesModule {}
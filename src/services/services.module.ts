import { Module } from '@nestjs/common';
import { RoleFilterService } from './RoleFilter.service';

@Module({
  providers: [RoleFilterService],
  exports: [RoleFilterService],
})
export class ServicesModule {}
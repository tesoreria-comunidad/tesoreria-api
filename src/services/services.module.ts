import { Module } from '@nestjs/common';
import { RoleFilterService } from './RoleFilterService';

@Module({
  providers: [RoleFilterService],
  exports: [RoleFilterService],
})
export class ServicesModule {}
import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';
import { LoggedUser } from 'src/auth/types';

@UseGuards(AuthGuard, RolesGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health-check')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  getHealthCheck(@Req() req: ExpressRequest) {
    const user = (req as ExpressRequest & { user: LoggedUser }).user;
    return this.monitoringService.getHealthCheck(user);
  }
}

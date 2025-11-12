import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CronJobsService } from './cron-jobs.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cron-jobs')
@UseGuards(AuthGuard, RolesGuard)
export class CronJobsController {
  constructor(private readonly cronJobsService: CronJobsService) {}

  /**
   * Ejecuta manualmente la actualización mensual de balances
   * Solo disponible para roles MASTER y DIRIGENTE
   */
  @Post('run-monthly-update')
  @Roles('MASTER', 'DIRIGENTE')
  async runMonthlyUpdate(@Req() req: ExpressRequest) {
    await this.cronJobsService.runMonthlyUpdateManually(req);
    return {
      message: 'Actualización mensual de balances ejecutada exitosamente',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtiene el estado del cronjob
   * Solo disponible para roles MASTER y DIRIGENTE
   */
  @Get('status')
  @Roles('MASTER', 'DIRIGENTE')
  getCronJobStatus() {
    const status = this.cronJobsService.getCronJobStatus();
    return {
      status,
      description: 'Estado del cronjob de actualización mensual de balances'
    };
  }

  /**
   * Detiene el cronjob
   * Solo disponible para rol MASTER
   */
  @Post('stop')
  @Roles('MASTER')
  stopCronJob() {
    this.cronJobsService.stopCronJob();
    return {
      message: 'Cronjob detenido exitosamente',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Inicia el cronjob
   * Solo disponible para rol MASTER
   */
  @Post('start')
  @Roles('MASTER')
  startCronJob() {
    this.cronJobsService.startCronJob();
    return {
      message: 'Cronjob iniciado exitosamente',
      timestamp: new Date().toISOString()
    };
  }
}

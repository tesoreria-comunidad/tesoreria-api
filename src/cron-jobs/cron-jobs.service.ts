import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma.service';
import { Balance } from '@prisma/client';
import { BalanceService } from 'src/balance/balance.service';

@Injectable()
export class CronJobsService {
  private readonly logger = new Logger(CronJobsService.name);
  private monthlyBalanceUpdateJob: CronJob;

  constructor(
    private prisma: PrismaService,
    private balanceService: BalanceService,
  ) {
    this.initializeCronJobs();
  }

  private initializeCronJobs() {
    // Cronjob que se ejecuta el primer día de cada mes a las 00:01
    // Patrón cron: segundo minuto hora día mes día_semana
    // '0 1 0 1 * *' = segundo 0, minuto 1, hora 0, día 1 del mes, cualquier mes, cualquier día de la semana
    this.monthlyBalanceUpdateJob = new CronJob(
      '0 1 0 1 * *',
      () => {
        this.updateFamilyBalancesForNewMonth();
      },
      null,
      true,
      'America/Argentina/Buenos_Aires', // Ajusta la zona horaria según tu ubicación
    );

    this.logger.log(
      'Cronjob de actualización mensual de balances inicializado',
    );
  }

  /**
   * Actualiza los balances de todas las familias restando el valor de la cuota activa
   * Se ejecuta automáticamente el primer día de cada mes
   */
  async updateFamilyBalancesForNewMonth(): Promise<void> {
    try {
      this.logger.log(
        'Iniciando actualización mensual de balances de familias',
      );

      // Obtener la cuota activa actual
      const activeCuota = await this.prisma.cuota.findFirst({
        where: { is_active: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeCuota) {
        this.logger.warn(
          'No se encontró una cuota activa. No se actualizarán los balances.',
        );
        return;
      }

      this.logger.log(`Cuota activa encontrada: $${activeCuota.value}`);

      // Obtener todas las familias con sus balances
      const families = await this.prisma.family.findMany({
        include: {
          balance: true,
          users: true,
        },
      });

      if (families.length === 0) {
        this.logger.warn('No se encontraron familias para actualizar.');
        return;
      }

      const activeFamilies = families.filter(
        (f) => f.users.filter((u) => u.is_active && !u.is_granted).length > 0,
      ); //  para que una familia se considere activa tiene que tener por lo menos un usuario activo.

      this.logger.log(
        `Actualizando balances de ${activeFamilies.length} familias`,
      );

      let successCount = 0;
      let errorCount = 0;

      // Actualizar el balance de cada familia
      for (const family of activeFamilies) {
        try {
          await this.balanceService.updateBalanceForFamily(family.id);

          successCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Error al actualizar balance de familia ${family.name}: ${errorMessage}`,
            errorStack,
          );
          errorCount++;
        }
      }

      this.logger.log(
        `Actualización mensual completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error en la actualización mensual de balances: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Método para ejecutar manualmente la actualización (útil para testing)
   */
  async runMonthlyUpdateManually(): Promise<void> {
    this.logger.log('Ejecutando actualización mensual manualmente...');
    await this.updateFamilyBalancesForNewMonth();
  }

  /**
   * Obtiene el estado del cronjob
   */
  getCronJobStatus(): { isRunning: boolean; nextRun: Date | null } {
    return {
      isRunning: this.monthlyBalanceUpdateJob ? true : false,
      nextRun: this.monthlyBalanceUpdateJob?.nextDate()?.toJSDate() || null,
    };
  }

  /**
   * Detiene el cronjob
   */
  stopCronJob(): void {
    if (this.monthlyBalanceUpdateJob) {
      this.monthlyBalanceUpdateJob.stop();
      this.logger.log('Cronjob de actualización mensual detenido');
    }
  }

  /**
   * Inicia el cronjob
   */
  startCronJob(): void {
    if (this.monthlyBalanceUpdateJob) {
      this.monthlyBalanceUpdateJob.start();
      this.logger.log('Cronjob de actualización mensual iniciado');
    }
  }
}

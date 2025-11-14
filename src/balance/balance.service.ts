import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Balance, Family } from '@prisma/client';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { PrismaService } from 'src/prisma.service';
import { startOfMonth, endOfMonth } from 'date-fns';
import { AuthService } from 'src/auth/auth.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { extractLoggedUser } from 'src/auth/request.util';
@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private authService: AuthService,
    private actionLogsService: ActionLogsService,
  ) {}
  // Actor resolution is centralized in ActionLogsService; services should pass reqOrActor to start()/create() and
  // reuse the returned log.id_user when they need the actor id.
  public async getAllBalances(reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      const loggedUser = extractLoggedUser(reqOrActor);
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.balance.findMany({
        where,
        include: {
          family: true,
        },
      });
    } catch (error) {
      console.log('Error al obtener los balances: ', error);
      throw new InternalServerErrorException('Error al obtener los balances');
    }
  }

  public async getById(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const balance = await this.prisma.balance.findFirst({
        where: {
          id,
        },
        include: {
          family: true,
        },
      });

      if (!balance) {
        throw new NotFoundException(`Balance con ID ${id} no encontrado`);
      }

      return balance;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al obtener el balance: ', error);
      throw new InternalServerErrorException('Error al obtener el balance');
    }
  }

  public async create(data: CreateBalanceDTO, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      // Let ActionLogsService resolve the actor from the request (or accept 'SYSTEM')
      const { log } = await this.actionLogsService.start(
        ActionType.BALANCE_CREATE,
        reqOrActor ?? 'SYSTEM',
        { metadata: { action: 'create_balance', payload: { ...data } } },
      );

      const created = await this.prisma.balance.create({
        data,
        include: {
          family: true,
        },
      });

      await this.actionLogsService.markSuccess(log.id, 'Balance creado correctamente', {
        createdId: created.id,
      });

      return created;
    } catch (error) {
      console.log('Error al crear el balance: ', error);
      // best-effort: mark error on the log if present
      try {
        if ((error as any)?.logId) await this.actionLogsService.markError((error as any).logId, error as Error);
      } catch {}
      throw new InternalServerErrorException('Error al crear el balance');
    }
  }

  public async update(id: string, data: UpdateBalanceDTO, reqOrActor?: ExpressRequest | 'SYSTEM') {
    let log: any = null;
    // Start the action log and let ActionLogsService resolve the actor
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      await this.getById(id, reqOrActor as any);

      // start action log for single balance update
      const startRes = await this.actionLogsService.start(
        ActionType.BALANCE_UPDATE,
        reqOrActor ?? 'SYSTEM',
        { metadata: { action: 'update_balance', targetId: id, payload: { ...data } } },
      );
      log = startRes.log;

      this.logger.debug('Actualizando balance con data: ' + JSON.stringify(data));
      const updated = await this.prisma.balance.update({
        where: {
          id: id,
        },
        data,
        include: {
          family: true,
        },
      });

      await this.actionLogsService.markSuccess(log.id, 'Balance actualizado correctamente', {
        updatedId: updated.id,
      });

      return updated;
    } catch (error) {
      console.log('Error al actualizar el balance', error);
      if (log && log.id) {
        await this.actionLogsService.markError(log.id, error as Error);
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el balance');
    }
  }
  public async resetAll(reqOrActor?: ExpressRequest | 'SYSTEM') {
    let log: any = null;
    try {
      const startRes = await this.actionLogsService.start(
        ActionType.BALANCE_UPDATE,
        reqOrActor ?? 'SYSTEM',
        { metadata: { action: 'reset_all_balances' } },
      );
      log = startRes.log;

      await this.prisma.balance.updateMany({
        data: { value: 0 },
      });

      await this.actionLogsService.markSuccess(log.id, 'Balances reseteados correctamente');
    } catch (error) {
      console.log('Error al actualizar el balance', error);
      if (log && log.id) {
        await this.actionLogsService.markError(log.id, error as Error);
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el balance');
    }
  }
  public async updateAll(reqOrActor?: ExpressRequest | 'SYSTEM') {
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    // support passing either the Express request (controller flow) or the literal 'SYSTEM'
    // Do not resolve actor here; just check existing logs for the month range.
    const already = await this.prisma.actionLog.findFirst({
      where: {
        action_type: ActionType.BALANCE_UPDATE_ALL,
        createdAt: { gte: from, lte: to },
      },
      select: { id: true, createdAt: true, status: true },
    });
    if (already && already.status !== 'ERROR') {
      throw new BadRequestException(
        `La actualización de balances ya se ejecutó este mes (${already.createdAt.toISOString()}).`,
      );
    }
    const { log } = await this.actionLogsService.start(
      ActionType.BALANCE_UPDATE_ALL,
      reqOrActor ?? 'SYSTEM',
      { metadata: { notes: 'Inicio de actualización mensual' } },
    );
    try {
      const families = await this.prisma.family.findMany({
        include: {
          balance: true,
          users: true,
        },
      });
      const activeFamilies = families.filter(
        (f) => f.users.filter((u) => u.is_active && !u.is_granted).length > 0,
      ); //  para que una familia se considere activa tiene que tener por lo menos un usuario activo.
      this.logger.debug(
        `Actualizando balances de ${activeFamilies.length} familias`,
      );
      let successCount = 0;
      let errorCount = 0;

      for (const family of activeFamilies) {
        try {
          await this.updateBalanceForFamily(family.id);

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

      await this.actionLogsService.markSuccess(log.id, 'Balances actualizados correctamente', {
        notes: 'Actualizacion mensual de balances realiazada correctamente',
        totalFamiliesUpdated: successCount,
        totalFamilesError: errorCount,
      });
      return `Actualización mensual completada. Éxitos: ${successCount}, Errores: ${errorCount}`;
    } catch (error) {
      console.log('Error al actualizar el balance', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el balance');
    }
  }

  public async delete(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      // Verificar que el balance existe
      await this.getById(id, reqOrActor);

      return await this.prisma.balance.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al eliminar el balance: ', error);
      throw new InternalServerErrorException('Error al eliminar el balance');
    }
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Balance;
    value: string | number | boolean;
  }) {
    try {
      return await this.prisma.balance.findFirst({ where: { [key]: value } });
    } catch (error) {
      console.log('Error en la búsqueda de balance: ', error);
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }

  public async updateBalanceForFamily(familyId: string, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Family> {
    let log: any = null;
    try {
      // 1. Obtener la familia con usuarios y balance
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          users: true,
          balance: true,
        },
      });
      if (!family) throw new Error('Familia no encontrada');

      const familyBalance = await this.prisma.balance.findUnique({
        where: {
          id: family.id_balance,
        },
      });
      if (!familyBalance)
        throw new Error(`Balance de la Familia ${family.name} no encontrado`);
      let cuotaValue = 0;
      // 1b. Si la familia tiene una cuota personalizada, se usa el valor personalizado
      if (familyBalance.is_custom_cuota) {
        cuotaValue = familyBalance.custom_cuota;
      } else {
        // 2. Contar usuarios activos
        const usersCount = family.users.filter(
          (u) => u.is_active && !u.is_granted,
        ).length;

        // 3. Buscar el valor de cuota según cantidad de usuarios activos
        const CPH = await this.prisma.cuotaPorHermanos.findFirst({
          where: { cantidad: usersCount },
        });

        // Si no hay configuración, usar un valor por defecto (ejemplo: 0)
        cuotaValue = CPH?.valor ?? 0;
      }

      // Start an ActionLog for this family's balance update
      const startRes = await this.actionLogsService.start(
        ActionType.BALANCE_UPDATE_FAMILY,
        reqOrActor ?? 'SYSTEM',
        {
          target_table: ActionTargetTable.FAMILY,
          target_id: family.id,
          metadata: { action: 'update_balance_for_family', familyId },
        },
      );
      log = startRes.log;

      // 5. Actualizar el balance
      const oldBalance = familyBalance.value;
      const newBalance = oldBalance - cuotaValue;
      await this.prisma.balance.update({
        where: { id: family.balance.id },
        data: { value: newBalance, previousValue: oldBalance },
      });

      await this.actionLogsService.markSuccess(log.id, 'Balance actualizado para familia', {
        familyId: family.id,
        familyName: family.name,
        oldValue: oldBalance,
        newValue: newBalance,
        cuotaApplied: cuotaValue,
      });

      this.logger.debug(
        `Balance actualizado para familia ${family.name}: $${family.balance.value} -> $${newBalance} (Cuota aplicada: $${cuotaValue})`,
      );

      return family;
    } catch (error) {
      if (log && log.id) {
        try {
          await this.actionLogsService.markError(log.id, error as Error);
        } catch {}
      }
      throw error;
    }
  }
}

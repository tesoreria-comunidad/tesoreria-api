import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient, Cuota } from '@prisma/client';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { PrismaService } from 'src/prisma.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';

@Injectable()
export class CuotaService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private actionLogsService: ActionLogsService,
  ) {}
  public async getAllCuota(loggedUser: any, actorId?: string) {
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.cuota.findMany({ where });
    } catch (error) {
      console.log('Error al obtener las cuotas:', error);
      throw new InternalServerErrorException('Error al obtener las cuotas');
    }
  }

  public async getById(id: string, loggedUser: any, actorId?: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      const cuota = await this.prisma.cuota.findFirst({
        where,
      });

      if (!cuota) {
        throw new NotFoundException(`Cuota con ID ${id} no encontrada`);
      }

      return cuota;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al obtener la cuota: ', error);
      throw new InternalServerErrorException('Error al obtener la cuota');
    }
  }

  public async create(data: CreateCuotaDTO, actorId?: string) {
    try {
      if (data.value < 0) {
        throw new BadRequestException('Los montos no pueden ser negativos');
      }
      const activeCuota = await this.prisma.cuota.findFirst({
        where: { is_active: true },
      });
      if (activeCuota) {
        await this.prisma.cuota.update({
          where: { id: activeCuota.id },
          data: { is_active: false },
        });
      }

      const log = await this.actionLogsService.start(ActionType.CUOTA_CREATE, actorId ?? 'system', {
        target_table: ActionTargetTable.CUOTA,
        metadata: { action: 'create_cuota', payload: { ...data } },
      });

      try {
        const created = await this.prisma.cuota.create({ data });
        await this.actionLogsService.markSuccess(log.id, 'Cuota creada', { createdId: created.id });
        return created;
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.log('Error al crear la cuota: ', error);
      throw new InternalServerErrorException('Error al crear la cuota');
    }
  }

  public async update(id: string, data: UpdateCuotaDTO, loggedUser: any, actorId?: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      // Verificar que la cuota existe
      await this.getById(id, loggedUser);

      if (data.value !== undefined && data.value < 0) {
        throw new BadRequestException(
          'El monto de cuota no puede ser negativo',
        );
      }

      if (data.cfa_amount !== undefined && data.cfa_amount < 0) {
        throw new BadRequestException('El monto de CFA no puede ser negativo');
      }

      const log = await this.actionLogsService.start(ActionType.CUOTA_UPDATE, actorId ?? 'system', {
        target_table: ActionTargetTable.CUOTA,
        target_id: id,
        metadata: { action: 'update_cuota', payload: { ...data } },
      });
      try {
        const updated = await this.prisma.cuota.update({ where, data });
        await this.actionLogsService.markSuccess(log.id, 'Cuota actualizada', { updatedId: updated.id });
        return updated;
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al actualizar la cuota: ', error);
      throw new InternalServerErrorException('Error al actualizar la cuota');
    }
  }

  public async delete(id: string, loggedUser: any, actorId?: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      // Verificar que la cuota existe
      await this.getById(id, loggedUser);

      const log = await this.actionLogsService.start(ActionType.CUOTA_DELETE, actorId ?? 'system', {
        target_table: ActionTargetTable.CUOTA,
        target_id: id,
        metadata: { action: 'delete_cuota' },
      });
      try {
        const deleted = await this.prisma.cuota.delete({ where });
        await this.actionLogsService.markSuccess(log.id, 'Cuota eliminada', { deletedId: deleted.id });
        return deleted;
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al eliminar la cuota: ', error);
      throw new InternalServerErrorException('Error al eliminar la cuota');
    }
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Cuota;
    value: string | number;
  }) {
    try {
      return await this.prisma.cuota.findFirst({ where: { [key]: value } });
    } catch (error) {
      console.log('Error en la búsqueda de cuota: ', error);
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }

  /**
   * Obtiene la cuota activa actual
   * Útil para el cronjob y otros procesos que necesiten la cuota vigente
   */
  public async getActiveCuota() {
    try {
      return await this.prisma.cuota.findFirst({
        where: { is_active: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.log('Error al obtener la cuota activa: ', error);
      throw new InternalServerErrorException(
        'Error al obtener la cuota activa',
      );
    }
  }
}

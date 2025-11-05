import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCuotaPorHermanosDto, UpdateCuotaPorHermanosDto } from './dto/cuota-por-hermanos.dto';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionTargetTable } from '@prisma/client';

// NOTE: new ActionType values (CPH_CREATE/UPDATE/DELETE) were added to schema.prisma;
// until prisma client is regenerated we will pass the action string as any when calling start().

@Injectable()
export class CuotaPorHermanosService {
  constructor(private prisma: PrismaService, private actionLogsService: ActionLogsService) {}

  async create(data: CreateCuotaPorHermanosDto) {
    // Evitar duplicados
    const exists = await this.prisma.cuotaPorHermanos.findFirst({ where: { cantidad: data.cantidad } });
    if (exists) throw new ConflictException('Ya existe una cuota para esa cantidad de hermanos');

    const log = await this.actionLogsService.start(('CPH_CREATE' as any) as any, 'system', {
      target_table: ActionTargetTable.CPH,
      metadata: { action: 'create_cph', payload: { ...data } },
    });

    try {
      const created = await this.prisma.cuotaPorHermanos.create({ data });
      await this.actionLogsService.markSuccess(log.id, 'Cuota por hermanos creada', { createdId: created.id });
      return created;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.cuotaPorHermanos.findMany({ orderBy: { cantidad: 'asc' } });
  }

  async findOne(id: string) {
    const cuota = await this.prisma.cuotaPorHermanos.findUnique({ where: { id } });
    if (!cuota) throw new NotFoundException('No encontrada');
    return cuota;
  }

  async update(id: string, data: UpdateCuotaPorHermanosDto, actorId?: string) {
    await this.findOne(id); // Valida existencia
    const log = await this.actionLogsService.start(('CPH_UPDATE' as any) as any, actorId ?? 'system', {
      target_table: ActionTargetTable.CPH,
      target_id: id,
      metadata: { action: 'update_cph', payload: { ...data } },
    });
    try {
      const updated = await this.prisma.cuotaPorHermanos.update({ where: { id }, data });
      await this.actionLogsService.markSuccess(log.id, 'Cuota por hermanos actualizada', { updatedId: updated.id });
      return updated;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      throw error;
    }
  }

  async remove(id: string, actorId?: string) {
    await this.findOne(id); // Valida existencia
    const log = await this.actionLogsService.start(('CPH_DELETE' as any) as any, actorId ?? 'system', {
      target_table: ActionTargetTable.CPH,
      target_id: id,
      metadata: { action: 'delete_cph' },
    });
    try {
      const deleted = await this.prisma.cuotaPorHermanos.delete({ where: { id } });
      await this.actionLogsService.markSuccess(log.id, 'Cuota por hermanos eliminada', { deletedId: deleted.id });
      return deleted;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      throw error;
    }
  }
}
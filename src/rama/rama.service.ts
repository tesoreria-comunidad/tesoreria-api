import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient, Rama } from '@prisma/client';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { PrismaService } from 'src/prisma.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionTargetTable, ActionType } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

@Injectable()
export class RamaService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private actionLogsService: ActionLogsService,
  ) {}
  public async getAllRama() {
    try {
      return await this.prisma.rama.findMany({
        include: {
          users: true,
        },
      });
    } catch (error) {
      console.log('Error al obtener las ramas:', error);
      throw new InternalServerErrorException('Error al obtener las ramas');
    }
  }

  public async getById(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const rama = await this.prisma.rama.findFirst({
        where: {
          id,
        },
        include: {
          users: true,
        },
      });

      if (!rama) {
        throw new NotFoundException(`Rama con ID ${id} no encontrada`);
      }

      return rama;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al obtener la rama:', error);
      throw new InternalServerErrorException('Error al obtener la rama');
    }
  }

  public async create(data: CreateRamaDTO, reqOrActor?: ExpressRequest | 'SYSTEM') {
    const { log } = await this.actionLogsService.start(ActionType.RAMA_CREATE, reqOrActor ?? 'SYSTEM', {
      target_table: ActionTargetTable.RAMA,
      metadata: { action: 'create_rama', payload: { ...data } },
    });
    const actorId = log.id_user;
    try {
      if (!data.name || data.name.trim().length === 0) {
        throw new BadRequestException('El nombre de la rama es requerido');
      }

      // Verificar si ya existe una rama con el mismo nombre
      const existingRama = await this.prisma.rama.findFirst({
        where: { name: data.name.trim() },
      });

      if (existingRama) {
        throw new ConflictException('Ya existe una rama con ese nombre');
      }

      try {
        const created = await this.prisma.rama.create({
          data: { ...data, name: data.name.trim() },
          include: { users: true },
        });
        await this.actionLogsService.markSuccess(log.id, 'Rama creada', { createdId: created.id });
        return created;
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
      try {
        const created = await this.prisma.rama.create({
          data: { ...data, name: data.name.trim() },
          include: { users: true },
        });
        await this.actionLogsService.markSuccess(log.id, 'Rama creada', { createdId: created.id });
        return created;
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.log('Error al crear la rama:', error);
      throw new InternalServerErrorException('Error al crear la rama');
    }
  }

  public async update(id: string, data: UpdateRamaDTO, reqOrActor?: ExpressRequest | 'SYSTEM') {
    const { log } = await this.actionLogsService.start(ActionType.RAMA_UPDATE, reqOrActor ?? 'SYSTEM', {
      target_table: ActionTargetTable.RAMA,
      target_id: id,
      metadata: { action: 'update_rama', payload: { ...data } },
    });
    const actorId = log.id_user;
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
  // Verificar que la rama existe
  await this.getById(id, reqOrActor);

      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
          throw new BadRequestException(
            'El nombre de la rama no puede estar vacío',
          );
        }

        // Verificar si ya existe otra rama con el mismo nombre
        const existingRama = await this.prisma.rama.findFirst({
          where: {
            name: data.name.trim(),
            NOT: { id },
          },
        });

        if (existingRama) {
          throw new ConflictException('Ya existe otra rama con ese nombre');
        }
      }

    try {
      const updated = await this.prisma.rama.update({
        where: { id },
        data: { ...data, name: data.name ? data.name.trim() : undefined },
        include: { users: true },
      });
      await this.actionLogsService.markSuccess(log.id, 'Rama actualizada', { updatedId: updated.id });
      return updated;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      throw error;
    }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.log('Error al actualizar la rama:', error);
      throw new InternalServerErrorException('Error al actualizar la rama');
    }
  }

  public async delete(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    const { log } = await this.actionLogsService.start(ActionType.RAMA_DELETE, reqOrActor ?? 'SYSTEM', {
      target_table: ActionTargetTable.RAMA,
      target_id: id,
      metadata: { action: 'delete_rama' },
    });
    const actorId = log.id_user;
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
  // Verificar que la rama existe
  const rama = await this.getById(id, reqOrActor);

      // Verificar si tiene usuarios asociados
      if (rama.users && rama.users.length > 0) {
        throw new ConflictException(
          'No se puede eliminar una rama que tiene usuarios asociados',
        );
      }

    try {
      const deleted = await this.prisma.rama.delete({ where: { id } });
      await this.actionLogsService.markSuccess(log.id, 'Rama eliminada', { deletedId: deleted.id });
      return deleted;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      throw error;
    }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.log('Error al eliminar la rama:', error);
      throw new InternalServerErrorException('Error al eliminar la rama');
    }
  }

  public async findBy({ key, value }: { key: keyof Rama; value: string }) {
    try {
      return await this.prisma.rama.findFirst({ where: { [key]: value } });
    } catch (error) {
      console.log('Error en la búsqueda:', error);
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

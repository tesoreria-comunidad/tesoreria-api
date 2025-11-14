import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Folder } from '@prisma/client';
import { CreateFolderDTO, UpdateFolderDTO } from './dto/folder.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { PrismaService } from 'src/prisma.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class FolderService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private actionLogsService: ActionLogsService,
    private authService: AuthService,
  ) {}
  

  public async getAllFolder(reqOrActor?: ExpressRequest | 'SYSTEM') {
    let loggedUser: any = undefined;
    if (reqOrActor && typeof reqOrActor !== 'string') loggedUser = (reqOrActor as any).user;
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.folder.findMany({
        where,
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.log('Error al obtener las carpetas: ', error);
      throw new InternalServerErrorException('Error al obtener las carpetas');
    }
  }

  public async getById(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    let loggedUser: any = undefined;
    if (reqOrActor && typeof reqOrActor !== 'string') loggedUser = (reqOrActor as any).user;
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      const folder = await this.prisma.folder.findFirst({
        where,
        include: {
          user: true,
        },
      });

      if (!folder) {
        throw new NotFoundException(`Carpeta con ID ${id} no encontrada`);
      }

      return folder;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al obtener la carpeta: ', error);
      throw new InternalServerErrorException('Error al obtener la carpeta');
    }
  }

  public async create(data: CreateFolderDTO, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      const { log } = await this.actionLogsService.start(ActionType.FOLDER_CREATE, reqOrActor ?? 'SYSTEM', {
        target_table: ActionTargetTable.FOLDER,
        metadata: { action: 'create_folder', payload: { ...data } },
      });
      try {
        const created = await this.prisma.folder.create({ data, include: { user: true } });
        await this.actionLogsService.markSuccess(log.id, 'Carpeta creada', { createdId: created.id });
        return created;
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      console.log('Error al crear la carpeta: ', error);
      throw new InternalServerErrorException('Error al crear la carpeta');
    }
  }

  public async update(id: string, data: UpdateFolderDTO, reqOrActor?: ExpressRequest | 'SYSTEM') {
    let loggedUser: any = undefined;
    if (reqOrActor && typeof reqOrActor !== 'string') loggedUser = (reqOrActor as any).user;
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      // Verificar que la carpeta existe
      await this.getById(id, reqOrActor);
      const { log } = await this.actionLogsService.start(ActionType.FOLDER_UPDATE, reqOrActor ?? 'SYSTEM', {
        target_table: ActionTargetTable.FOLDER,
        target_id: id,
        metadata: { action: 'update_folder', payload: { ...data } },
      });
      try {
        const updated = await this.prisma.folder.update({ where, data, include: { user: true } });
        await this.actionLogsService.markSuccess(log.id, 'Carpeta actualizada', { updatedId: updated.id });
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
      console.log('Error al actualizar la carpeta: ', error);
      throw new InternalServerErrorException('Error al actualizar la carpeta');
    }
  }

  public async delete(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    let loggedUser: any = undefined;
    if (reqOrActor && typeof reqOrActor !== 'string') loggedUser = (reqOrActor as any).user;
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      // Verificar que la carpeta existe
      await this.getById(id, reqOrActor);
      const { log } = await this.actionLogsService.start(ActionType.FOLDER_DELETE, reqOrActor ?? 'SYSTEM', {
        target_table: ActionTargetTable.FOLDER,
        target_id: id,
        metadata: { action: 'delete_folder' },
      });
      try {
        const deleted = await this.prisma.folder.delete({ where });
        await this.actionLogsService.markSuccess(log.id, 'Carpeta eliminada', { deletedId: deleted.id });
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
      console.log('Error al eliminar la carpeta: ', error);
      throw new InternalServerErrorException('Error al eliminar la carpeta');
    }
  }

  public async findBy({ key, value }: { key: keyof Folder; value: string }) {
    try {
      return await this.prisma.folder.findFirst({ where: { [key]: value } });
    } catch (error) {
      console.log('Error en la búsqueda: ', error);
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

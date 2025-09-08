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

@Injectable()
export class FolderService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
  ) {}
  public async getAllFolder(loggedUser: any) {
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.folder.findMany({
        where,
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las carpetas');
    }
  }

  public async getById(id: string, loggedUser: any) {
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
      throw new InternalServerErrorException('Error al obtener la carpeta');
    }
  }

  public async create(data: CreateFolderDTO) {
    try {
      return await this.prisma.folder.create({
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al crear la carpeta');
    }
  }

  public async update(id: string, data: UpdateFolderDTO, loggedUser: any) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      // Verificar que la carpeta existe
      await this.getById(id, loggedUser);

      return await this.prisma.folder.update({
        where,
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar la carpeta');
    }
  }

  public async delete(id: string, loggedUser: any) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      // Verificar que la carpeta existe
      await this.getById(id, loggedUser);

      return await this.prisma.folder.delete({
        where,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar la carpeta');
    }
  }

  public async findBy({ key, value }: { key: keyof Folder; value: string }) {
    try {
      return await this.prisma.folder.findFirst({ where: { [key]: value } });
    } catch (error) {
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

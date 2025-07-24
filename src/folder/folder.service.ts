import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient, Folder } from '@prisma/client';
import { CreateFolderDTO, UpdateFolderDTO } from './dto/folder.dto';

@Injectable()
export class FolderService {
  private prisma = new PrismaClient();

  public async getAllFolder() {
    try {
      return await this.prisma.folder.findMany({
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las carpetas');
    }
  }

  public async getById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      const folder = await this.prisma.folder.findFirst({ 
        where: { id },
        include: {
          user: true,
        },
      });

      if (!folder) {
        throw new NotFoundException(`Carpeta con ID ${id} no encontrada`);
      }

      return folder;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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

  public async update(id: string, data: UpdateFolderDTO) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que la carpeta existe
      await this.getById(id);

      return await this.prisma.folder.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar la carpeta');
    }
  }

  public async delete(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que la carpeta existe
      await this.getById(id);

      return await this.prisma.folder.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar la carpeta');
    }
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Folder;
    value: string;
  }) {
    try {
      return await this.prisma.folder.findFirst({ where: { [key]: value } });
    } catch (error) {
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

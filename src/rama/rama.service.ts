import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient, Rama } from '@prisma/client';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { RoleFilterService } from 'src/services/RoleFilterService';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RamaService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
  ) {}
  public async getAllRama(loggedUser: any) {
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.rama.findMany({
        where,
        include: {
          users: true,
        },
      });
    } catch (error) {
      console.log('Error al obtener las ramas:', error);
      throw new InternalServerErrorException('Error al obtener las ramas');
    }
  }

  public async getById(id: string, loggedUser: any) {
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
      throw new InternalServerErrorException('Error al obtener la rama');
    }
  }

  public async create(data: CreateRamaDTO) {
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

      return await this.prisma.rama.create({
        data: {
          ...data,
          name: data.name.trim(),
        },
        include: {
          users: true,
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear la rama');
    }
  }

  public async update(id: string, data: UpdateRamaDTO, loggedUser: any) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      // Verificar que la rama existe
      await this.getById(id, loggedUser);

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

      return await this.prisma.rama.update({
        where: { id },
        data: {
          ...data,
          name: data.name ? data.name.trim() : undefined,
        },
        include: {
          users: true,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar la rama');
    }
  }

  public async delete(id: string, loggedUser: any) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      // Verificar que la rama existe
      const rama = await this.getById(id, loggedUser);

      // Verificar si tiene usuarios asociados
      if (rama.users && rama.users.length > 0) {
        throw new ConflictException(
          'No se puede eliminar una rama que tiene usuarios asociados',
        );
      }

      return await this.prisma.rama.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar la rama');
    }
  }

  public async findBy({ key, value }: { key: keyof Rama; value: string }) {
    try {
      return await this.prisma.rama.findFirst({ where: { [key]: value } });
    } catch (error) {
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

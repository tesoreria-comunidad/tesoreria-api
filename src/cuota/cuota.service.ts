import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient, Cuota } from '@prisma/client';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';

@Injectable()
export class CuotaService {
  private prisma = new PrismaClient();

  public async getAllCuota() {
    try {
      return await this.prisma.cuota.findMany();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las cuotas');
    }
  }

  public async getById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      const cuota = await this.prisma.cuota.findFirst({ 
        where: { id },
      });

      if (!cuota) {
        throw new NotFoundException(`Cuota con ID ${id} no encontrada`);
      }

      return cuota;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener la cuota');
    }
  }

  public async create(data: CreateCuotaDTO) {
    try {
      if (data.cuota_amount < 0 || data.cfa_amount < 0) {
        throw new BadRequestException('Los montos no pueden ser negativos');
      }

      return await this.prisma.cuota.create({ 
        data,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear la cuota');
    }
  }

  public async update(id: string, data: UpdateCuotaDTO) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que la cuota existe
      await this.getById(id);

      if (data.cuota_amount !== undefined && data.cuota_amount < 0) {
        throw new BadRequestException('El monto de cuota no puede ser negativo');
      }

      if (data.cfa_amount !== undefined && data.cfa_amount < 0) {
        throw new BadRequestException('El monto de CFA no puede ser negativo');
      }

      return await this.prisma.cuota.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar la cuota');
    }
  }

  public async delete(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que la cuota existe
      await this.getById(id);

      return await this.prisma.cuota.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

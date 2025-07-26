import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient, Balance } from '@prisma/client';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';

@Injectable()
export class BalanceService {
  private prisma = new PrismaClient();

  public async getAllBalances() {
    try {
      return await this.prisma.balance.findMany({
        include: {
          family: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los balances');
    }
  }

  public async getById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      const balance = await this.prisma.balance.findFirst({
        where: { id },
        include: {
          family: true,
        },
      });

      if (!balance) {
        throw new NotFoundException(`Balance con ID ${id} no encontrado`);
      }

      return balance;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el balance');
    }
  }

  public async create(data: CreateBalanceDTO) {
    try {
      return await this.prisma.balance.create({
        data,
        include: {
          family: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el balance');
    }
  }

  public async update(id: string, data: UpdateBalanceDTO) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que el balance existe
      await this.getById(id);

      return await this.prisma.balance.update({
        where: { id },
        data,
        include: {
          family: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el balance');
    }
  }

  public async delete(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que el balance existe
      await this.getById(id);

      return await this.prisma.balance.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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
      throw new InternalServerErrorException('Error en la búsqueda');
    }
  }
}

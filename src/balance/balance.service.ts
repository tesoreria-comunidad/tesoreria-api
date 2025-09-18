import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient, Balance } from '@prisma/client';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BalanceService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
  ) {}
  public async getAllBalances(loggedUser: any) {
    try {
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

  public async getById(id: string, loggedUser: any) {
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

  public async create(data: CreateBalanceDTO) {
    try {
      return await this.prisma.balance.create({
        data,
        include: {
          family: true,
        },
      });
    } catch (error) {
      console.log('Error al crear el balance: ', error);
      throw new InternalServerErrorException('Error al crear el balance');
    }
  }

  public async update(id: string, data: UpdateBalanceDTO, loggedUser: any) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      await this.getById(id, loggedUser);

      return await this.prisma.balance.update({
        where: {
          id: id,
        },
        data,
        include: {
          family: true,
        },
      });
    } catch (error) {
      console.log('Error al actualizar el balance', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el balance');
    }
  }

  public async delete(id: string, loggedUser: any) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      // Verificar que el balance existe
      await this.getById(id, loggedUser);

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

  public async updateBalanceForFamily(familyId: string): Promise<void> {
    // 1. Obtener la familia con usuarios y balance
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        users: true,
        balance: true,
      },
    });
    if (!family) throw new Error('Familia no encontrada');

    // 2. Contar usuarios activos
    const cantidadActivos = family.users.filter(u => u.is_active &&  !u.is_granted).length;

    // 3. Buscar el valor de cuota según cantidad de usuarios activos
    let cuotaConfig = await this.prisma.cuotaPorHermanos.findFirst({
      where: { cantidad: cantidadActivos },
    });

    // Si no hay configuración, usar un valor por defecto (ejemplo: 0)
    const valorCuota = cuotaConfig?.valor ?? 0;
    // 4. Aplicar la fórmula
    const montoADescontar = valorCuota * cantidadActivos * 0.8;

    // 5. Actualizar el balance
    const nuevoBalance = family.balance.value - montoADescontar;
    await this.prisma.balance.update({
      where: { id: family.balance.id },
      data: { value: nuevoBalance },
    });
  }

}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Balance, Family } from '@prisma/client';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
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
  public async resetAll() {
    try {
      await this.prisma.balance.updateMany({
        data: { value: 0 },
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
  public async updateAll() {
    try {
      const families = await this.prisma.family.findMany({
        include: {
          balance: true,
          users: true,
        },
      });
      const activeFamilies = families.filter(
        (f) => f.users.filter((u) => u.is_active && !u.is_granted).length > 0,
      ); //  para que una familia se considere activa tiene que tener por lo menos un usuario activo.
      this.logger.log(
        `Actualizando balances de ${activeFamilies.length} familias`,
      );
      let successCount = 0;
      let errorCount = 0;

      for (const family of activeFamilies) {
        try {
          await this.updateBalanceForFamily(family.id);

          successCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Error al actualizar balance de familia ${family.name}: ${errorMessage}`,
            errorStack,
          );
          errorCount++;
        }
      }

      return `Actualización mensual completada. Éxitos: ${successCount}, Errores: ${errorCount}`;
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

  public async updateBalanceForFamily(familyId: string): Promise<Family> {
    // 1. Obtener la familia con usuarios y balance
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        users: true,
        balance: true,
      },
    });
    if (!family) throw new Error('Familia no encontrada');

    const familyBalance = await this.prisma.balance.findUnique({
      where: {
        id: family.id_balance,
      },
    });
    if (!familyBalance)
      throw new Error(`Balance de la Familia ${family.name} no encontrado`);
    let cuotaValue = 0;
    // 1b. Si la familia tiene una cuota personalizada, se usa el valor personalizado
    if (familyBalance.is_custom_cuota) {
      cuotaValue = familyBalance.custom_cuota;
    } else {
    // 2. Contar usuarios activos
    const usersCount = family.users.filter(
      (u) => u.is_active && !u.is_granted,
    ).length;

    // 3. Buscar el valor de cuota según cantidad de usuarios activos
    const CPH = await this.prisma.cuotaPorHermanos.findFirst({
      where: { cantidad: usersCount },
    });

    // Si no hay configuración, usar un valor por defecto (ejemplo: 0)
     cuotaValue = CPH?.valor ?? 0;
    }

    // 5. Actualizar el balance
    const oldBalance = familyBalance.value;
    const newBalance = oldBalance - cuotaValue;
    await this.prisma.balance.update({
      where: { id: family.balance.id },
      data: { value: newBalance },
    });

    this.logger.log(
      `Balance actualizado para familia ${family.name}: $${family.balance.value} -> $${newBalance} (Cuota aplicada: $${cuotaValue})`,
    );

    return family;
  }
}

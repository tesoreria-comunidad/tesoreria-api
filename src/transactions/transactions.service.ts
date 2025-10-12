import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from './dto/transactions.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { log } from 'console';
import { TransactionDirection } from './constants';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private authService: AuthService,
  ) {}

  async create(data: CreateTransactionDTO, req: Request) {
    const { id: userId } = await this.authService.getDataFromToken(req);

    const log = await this.prisma.actionLog.create({
      data: {
        action_type: 'TRANSACTION_CREATE',
        id_user: userId,
        status: 'PENDING',
        target_table: 'TRANSACTIONS',
      },
    });
    try {
      if (data.id_family) {
        const family = await this.prisma.family.findUnique({
          where: { id: data.id_family },
        });
        if (!family)
          throw new NotFoundException(
            `Familia con ID ${data.id_family} no encontrada`,
          );
      }

      const newTransaccion = await this.prisma.transactions.create({
        data,
      });
      await this.prisma.actionLog.update({
        where: { id: log.id },
        data: {
          action_type: 'TRANSACTION_CREATE',
          id_user: userId,
          status: 'SUCCESS',
          target_table: 'TRANSACTIONS',
          id_transaction: newTransaccion.id,
          target_id: newTransaccion.id,
          metadata: {
            transactionAmoount: newTransaccion.amount,
          },
        },
      });
      return newTransaccion;
    } catch (error) {
      console.log('Error al crear la transacción', error);

      await this.prisma.actionLog.update({
        where: { id: log.id },
        data: {
          action_type: 'TRANSACTION_CREATE',
          id_user: userId,
          status: 'ERROR',
          target_table: 'TRANSACTIONS',
          message: (error as Error).message ?? 'Error no especificado',
        },
      });
      throw new InternalServerErrorException('Error al crear la transacción');
    }
  }

  async createFamilyTransaction(
    data: Omit<CreateTransactionDTO, 'direction' | 'category' | 'concept'>,
    req: Request,
  ) {
    const family = await this.prisma.family.findUnique({
      where: { id: data.id_family },
    });
    if (!family)
      throw new NotFoundException(
        `Familia con ID ${data.id_family} no encontrada`,
      );
    try {
      const newTransactionPayload: CreateTransactionDTO = {
        amount: data.amount,
        id_family: data.id_family,
        payment_method: data.payment_method,
        payment_date: data.payment_date || new Date().toISOString(),
        direction: TransactionDirection.INCOME,
        category: 'CUOTA',
        concept: `Cuota familiar - ${new Date().toLocaleDateString()}`,
        description: `Cuota mensual de la familia con ID ${data.id_family}`,
      };
      const transaction = await this.create(newTransactionPayload, req);
      // Actualizamos el balance de la familia
      const balance = await this.prisma.balance.findUnique({
        where: { id: family.id_balance },
      });

      if (!balance)
        throw new NotFoundException(
          `Balance con ID ${family.id_balance} no encontrado para la familia ${data.id_family}`,
        );

      await this.prisma.balance.update({
        where: { id: balance.id },
        data: { value: balance.value + data.amount },
      });
      return transaction;
    } catch (error) {
      console.log('Error al crear la transacción familiar', error);
      throw new InternalServerErrorException(
        `Error al crear la transacción familiar`,
      );
    }
  }

  async findAll(loggedUser: any) {
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.transactions.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.log('Error al obtener las transacciones', error);
      throw new InternalServerErrorException(
        'Error al obtener las transacciones',
      );
    }
  }

  async findOne(id: string) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const transaction = await this.prisma.transactions.findUnique({
        where: { id },
      });

      if (!transaction)
        throw new NotFoundException(`Transacción con ID ${id} no encontrada`);

      return transaction;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al obtener la transacción', error);
      throw new InternalServerErrorException('Error al obtener la transacción');
    }
  }

  async findByFamilyId(id_family: string) {
    try {
      if (!id_family)
        throw new BadRequestException('ID de familia es requerido');
      return await this.prisma.transactions.findMany({
        where: { id_family },
        orderBy: { payment_date: 'desc' },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.log('Error al obtener las transacciones por familia', error);
      throw new InternalServerErrorException(
        'Error al obtener las transacciones por familia',
      );
    }
  }
  async update(id: string, data: UpdateTransactionDTO, req: Request) {
    const { id: userId } = await this.authService.getDataFromToken(req);

    const log = await this.prisma.actionLog.create({
      data: {
        action_type: 'TRANSACTION_UPDATE',
        id_user: userId,
        status: 'PENDING',
        target_table: 'TRANSACTIONS',
      },
    });
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      // Verificamos existencia antes de actualizar
      await this.findOne(id);
      const transactionUpdated = await this.prisma.transactions.update({
        where: { id },
        data,
      });
      await this.prisma.actionLog.update({
        where: { id: log.id },
        data: {
          action_type: 'TRANSACTION_UPDATE',
          id_user: userId,
          status: 'SUCCESS',
          target_table: 'TRANSACTIONS',
          id_transaction: transactionUpdated.id,
          target_id: transactionUpdated.id,
          metadata: {
            transactionData: {
              ...transactionUpdated,
            },
          },
        },
      });

      return transactionUpdated;
    } catch (error) {
      await this.prisma.actionLog.update({
        where: { id: log.id },
        data: {
          action_type: 'TRANSACTION_UPDATE',
          id_user: userId,
          status: 'ERROR',
          target_table: 'TRANSACTIONS',
          message: (error as Error).message ?? 'Error no especificado',
        },
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al actualizar la transacción', error);
      throw new InternalServerErrorException(
        'Error al actualizar la transacción',
      );
    }
  }

  async remove(id: string, req: Request) {
    const { id: userId } = await this.authService.getDataFromToken(req);

    const log = await this.prisma.actionLog.create({
      data: {
        action_type: 'TRANSACTION_DELETE',
        id_user: userId,
        status: 'PENDING',
        target_table: 'TRANSACTIONS',
      },
    });
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      // Verificamos existencia antes de eliminar
      const transaction = await this.findOne(id);

      await this.prisma.transactions.delete({
        where: { id },
      });

      await this.prisma.actionLog.update({
        where: { id: log.id },
        data: {
          action_type: 'TRANSACTION_DELETE',
          id_user: userId,
          status: 'SUCCESS',
          target_table: 'TRANSACTIONS',
          metadata: {
            transactionDeleted: {
              ...transaction,
            },
          },
        },
      });

      return 'transaccion elimnada!';
    } catch (error) {
      await this.prisma.actionLog.update({
        where: { id: log.id },
        data: {
          action_type: 'TRANSACTION_DELETE',
          id_user: userId,
          status: 'ERROR',
          target_table: 'TRANSACTIONS',
          message: (error as Error).message ?? 'Error no especificado',
        },
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al eliminar la transacción', error);
      throw new InternalServerErrorException(
        'Error al eliminar la transacción',
      );
    }
  }
  async bulkCreate(transactions: CreateTransactionDTO[]) {
    try {
      // Transformamos fechas y validamos mínimamente
      const data = transactions.map((tx) => ({
        id_family: tx.id_family,
        amount: tx.amount,
        payment_method: tx.payment_method,
        direction: tx.direction,
        category: tx.category,
        payment_date: tx.payment_date ? new Date(tx.payment_date) : new Date(),
        concept: tx.concept,
        description: tx.description,
      }));

      const result = await this.prisma.transactions.createMany({
        data,
        skipDuplicates: true, // Evita error si hay UUIDs duplicados
      });

      return {
        message: `${result.count} transacciones creadas exitosamente`,
        count: result.count,
      };
    } catch (error) {
      console.log('Error al crear transacciones masivas', error);
      throw new InternalServerErrorException(
        'Error al crear transacciones en bloque',
      );
    }
  }
  async getMonthlyStats(loggedUser: any) {
    try {
      // Traemos todas las transacciones con fecha y dirección
      const where = this.roleFilterService.apply(loggedUser);
      const transactions = await this.prisma.transactions.findMany({
        where,
        select: {
          amount: true,
          payment_date: true,
          direction: true,
        },
      });

      // Reducimos a un formato { [YYYY-MM]: { income, expense } }
      const stats: Record<string, { income: number; expense: number }> = {};

      transactions.forEach((tx) => {
        const year = tx.payment_date.getFullYear();
        const month = tx.payment_date.getMonth() + 1; // 0 = Ene, 11 = Dic
        const key = `${year}-${String(month).padStart(2, '0')}`; // Ej: "2025-09"

        if (!stats[key]) stats[key] = { income: 0, expense: 0 };

        if (tx.direction === 'INCOME') {
          stats[key].income += tx.amount;
        } else {
          stats[key].expense += tx.amount;
        }
      });

      // Convertimos a array y ordenamos cronológicamente
      const result = Object.entries(stats)
        .map(([key, values]) => {
          const [year, month] = key.split('-');
          const date = new Date(Number(year), Number(month) - 1);

          return {
            key,
            month: date.toLocaleString('es-ES', { month: 'long' }), // ahora en español
            year: Number(year),
            income: values.income,
            expense: values.expense,
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));

      return result;
    } catch (error) {
      console.log('Error al generar estadísticas', error);
      throw new InternalServerErrorException('Error al generar estadísticas');
    }
  }

  public async getCategroies() {
    try {
      // Traemos todas las categorías sin usar distinct en la query
      const transactions = await this.prisma.transactions.findMany({
        select: { category: true },
      });
      // Creamos un Map para almacenar la primera aparición de cada categoría en minúsculas
      const uniqueMap = new Map<string, string>();
      transactions.forEach((tx) => {
        const key = tx.category.toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, tx.category);
        }
      });
      return Array.from(uniqueMap.values());
    } catch (error) {
      console.log('Error al obtener las categorías', error);
      throw new InternalServerErrorException('Error al obtener las categorías');
    }
  }
}

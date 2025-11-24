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
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private actionLogsService: ActionLogsService,
    private authService: AuthService,
  ) {}
  async create(
    data: CreateTransactionDTO,
    reqOrActor: ExpressRequest | 'SYSTEM',
  ) {
    const { log } = await this.actionLogsService.start(
      ActionType.TRANSACTION_CREATE,
      reqOrActor,
      { target_table: ActionTargetTable.TRANSACTIONS },
    );

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
      await this.actionLogsService.markSuccess(log.id, undefined, {
        id_transaction: newTransaccion.id,
        target_id: newTransaccion.id,
        transactionAmount: newTransaccion.amount,
      });
      return newTransaccion;
    } catch (error) {
      console.log('Error al crear la transacción', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException('Error al crear la transacción');
    }
  }

  async createFamilyTransaction(
    data: Omit<CreateTransactionDTO, 'direction' | 'category' | 'concept'>,
    reqOrActor: ExpressRequest | 'SYSTEM',
  ) {
    // delegate actor resolution to ActionLogsService via create()/start
    const family = await this.prisma.family.findUnique({
      where: { id: data.id_family },
    });

    if (!family)
      throw new NotFoundException(
        `Familia con ID ${data.id_family} no encontrada`,
      );

    const { log } = await this.actionLogsService.start(
      ActionType.TRANSACTION_CREATE,
      reqOrActor,
      {
        target_table: ActionTargetTable.TRANSACTIONS,
        id_family: data.id_family,
      },
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
      const transaction = await this.create(newTransactionPayload, reqOrActor);
      // Actualizamos el balance de la familia
      const balance = await this.prisma.balance.findUnique({
        where: { id: family.id_balance },
      });

      if (!balance)
        throw new NotFoundException(
          `Balance con ID ${family.id_balance} no encontrado para la familia ${data.id_family}`,
        );

      const prevBalanceBeforeUpdate = balance.value;
      const newBalanceValue = prevBalanceBeforeUpdate + data.amount;
      await this.prisma.balance.update({
        where: { id: balance.id },
        data: { value: balance.value + data.amount },
      });

      await this.actionLogsService.markSuccess(
        log.id,
        `Balance actualizado de ${prevBalanceBeforeUpdate} -> ${newBalanceValue}`,
        {
          id_transaction: transaction.id,
          target_id: transaction.id,
          transactionAmount: transaction.amount,
        },
      );
      return transaction;
    } catch (error) {
      console.log('Error al crear la transacción familiar', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException(
        `Error al crear la transacción familiar`,
      );
    }
  }

  async findAll(reqOrActor?: ExpressRequest | 'SYSTEM') {
    let loggedUser: any = undefined;
    if (reqOrActor && typeof reqOrActor !== 'string') {
      loggedUser = (reqOrActor as any).user;
    }
    try {
      return await this.prisma.transactions.findMany({
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

  async getTransactionsByFamily(id_rama: string) {
    try {
      if (!id_rama) {
        throw new BadRequestException('ID de rama es requerido');
      }
      // usuarios que pertenecen a la rama
      const users = await this.prisma.user.findMany({
        where: { id_rama },
        select: { id_family: true },
      });
      // obtenemos los ids de familia unicos asociados a esos usuarios
      const familyIdsFromUsers = Array.from(
        new Set(
          users
            .map((user) => user.id_family)
            .filter((family): family is string => !!family),
        ),
      );

      if (familyIdsFromUsers.length === 0) {
        return [];
      }
      // filtramos a las familias que son manejadas por la rama
      const families = await this.prisma.family.findMany({
        where: {
          id: { in: familyIdsFromUsers },
          manage_by: id_rama,
        },
        select: { id: true },
      });
      const familyIds = families.map((family) => family.id);
      if (familyIds.length === 0) {
        return [];
      }

      return await this.prisma.transactions.findMany({
        where: { id_family: { in: familyIds } },
        orderBy: { payment_date: 'desc' },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.log('Error al obtener las transacciones por rama', error);
      throw new InternalServerErrorException(
        'Error al obtener las transacciones por rama',
      );
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
  async update(
    id: string,
    data: UpdateTransactionDTO,
    reqOrActor: ExpressRequest | 'SYSTEM',
  ) {
    const { log } = await this.actionLogsService.start(
      ActionType.TRANSACTION_UPDATE,
      reqOrActor,
      { target_table: ActionTargetTable.TRANSACTIONS, target_id: id },
    );

    try {
      if (!id) throw new BadRequestException('ID es requerido');
      // Verificamos existencia antes de actualizar
      await this.findOne(id);
      const transactionUpdated = await this.prisma.transactions.update({
        where: { id },
        data,
      });
      // convert dates to ISO for JSON metadata
      const safeTransaction = {
        ...transactionUpdated,
        createdAt: transactionUpdated.createdAt.toISOString(),
        updatedAt: transactionUpdated.updatedAt.toISOString(),
        payment_date: transactionUpdated.payment_date.toISOString(),
      } as const;

      await this.actionLogsService.markSuccess(log.id, undefined, {
        id_transaction: transactionUpdated.id,
        target_id: transactionUpdated.id,
        transactionData: safeTransaction,
      });

      return transactionUpdated;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
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

  async remove(id: string, reqOrActor: ExpressRequest | 'SYSTEM') {
    const { log } = await this.actionLogsService.start(
      ActionType.TRANSACTION_DELETE,
      reqOrActor,
      { target_table: ActionTargetTable.TRANSACTIONS, target_id: id },
    );

    try {
      if (!id) throw new BadRequestException('ID es requerido');
      // Verificamos existencia antes de eliminar
      const transaction = await this.findOne(id);

      await this.prisma.transactions.delete({
        where: { id },
      });

      const safeTransaction = {
        ...transaction,
        createdAt: (transaction as any).createdAt
          ? (transaction as any).createdAt.toISOString()
          : null,
        updatedAt: (transaction as any).updatedAt
          ? (transaction as any).updatedAt.toISOString()
          : null,
        payment_date: (transaction as any).payment_date
          ? (transaction as any).payment_date.toISOString()
          : null,
      };

      await this.actionLogsService.markSuccess(log.id, undefined, {
        transactionDeleted: safeTransaction,
      });

      return 'transaccion elimnada!';
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
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
  async bulkCreate(
    transactions: CreateTransactionDTO[],
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { log } = await this.actionLogsService.start(
      ActionType.TRANSACTION_CREATE,
      reqOrActor ?? 'SYSTEM',
      {
        target_table: ActionTargetTable.TRANSACTIONS,
        metadata: { action: 'bulk_create_transactions' },
      },
    );

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

      await this.actionLogsService.markSuccess(
        log.id,
        `Carga masiva completada (${result.count})`,
        {
          createdCount: result.count,
        },
      );

      return {
        message: `${result.count} transacciones creadas exitosamente`,
        count: result.count,
      };
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      console.log('Error al crear transacciones masivas', error);
      throw new InternalServerErrorException(
        'Error al crear transacciones en bloque',
      );
    }
  }
  async getMonthlyStats(reqOrActor?: ExpressRequest | 'SYSTEM') {
    let loggedUser: any = undefined;
    if (reqOrActor && typeof reqOrActor !== 'string') {
      loggedUser = (reqOrActor as any).user;
    }
    try {
      // Traemos todas las transacciones con fecha y dirección
      const transactions = await this.prisma.transactions.findMany({
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

  public async getCategories() {
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

  async bulkCommunityTransactions(
    transactions: CreateTransactionDTO[],
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { log } = await this.actionLogsService.start(
      ActionType.TRANSACTION_CREATE,
      reqOrActor ?? 'SYSTEM',
      {
        target_table: ActionTargetTable.TRANSACTIONS,
      },
    );

    const valid: CreateTransactionDTO[] = [];
    const ignoredByCategory: any[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];

      if (tx.category?.toUpperCase() === 'CUOTA') {
        ignoredByCategory.push({
          index: i,
          reason: 'Categoría CUOTA no permitida',
          concept: tx.concept,
          amount: tx.amount,
          id_family: tx.id_family,
        });
        continue;
      }

      valid.push(tx);
    }

    if (valid.length === 0) {
      throw new BadRequestException({
        message:
          'No se pudo crear ninguna transacción. Todas fueron ignoradas por categoría CUOTA',
        ignoredByCategory,
      });
    }

    try {
      const result = await this.prisma.transactions.createMany({
        data: valid.map((tx) => ({
          ...tx,
          payment_date: tx.payment_date ?? new Date().toISOString(),
        })),
        skipDuplicates: true,
      });
      await this.actionLogsService.markSuccess(
        log.id,
        `Carga masiva comunitaria (${result.count} creadas, ${ignoredByCategory.length} ignoradas por CUOTA)`,
        { createdCount: result.count, ignoredByCategory },
      );

      return {
        message: 'Carga masiva completada exitosamente',
        created: result.count,
        ignoredByCategory: ignoredByCategory.length,
      };
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);

      throw new InternalServerErrorException(
        'No se pudieron crear las transacciones',
      );
    }
  }
}

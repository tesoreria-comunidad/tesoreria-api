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
import { RoleFilterService } from 'src/services/RoleFilterService';
import { log } from 'console';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService, private roleFilterService: RoleFilterService) {}

  async create(data: CreateTransactionDTO) {
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

      return await this.prisma.transactions.create({
        data,
      });
    } catch (error) {
      console.log('Error al crear la transacción', error);
      throw new InternalServerErrorException('Error al crear la transacción');
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
      throw new InternalServerErrorException('Error al obtener las transacciones');
    }
  }

  async findOne(id: string, loggedUser: any) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const where = this.roleFilterService.apply(loggedUser)
      const transaction = await this.prisma.transactions.findUnique({
        where,
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
      throw new InternalServerErrorException('Error al obtener la transacción');
    }
  }

  async update(id: string, data: UpdateTransactionDTO, loggedUser: any) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const where = this.roleFilterService.apply({loggedUser});
      // Verificamos existencia antes de actualizar
      await this.findOne(id, loggedUser);

      return await this.prisma.transactions.update({
        where,
        data,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar la transacción',
      );
    }
  }

  async remove(id: string, loggedUser: any) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const where = this.roleFilterService.apply(loggedUser);
      // Verificamos existencia antes de eliminar
      await this.findOne(id, loggedUser);
      
      return await this.prisma.transactions.delete({
        where,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar la transacción');
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

      // Reducimos a un formato { [mes]: { income, expense } }
      const stats: Record<string, { income: number; expense: number }> = {};

      transactions.forEach((tx) => {
        const month = tx.payment_date.toLocaleString('en-US', {
          month: 'long',
        }); // "January"
        if (!stats[month]) stats[month] = { income: 0, expense: 0 };

        if (tx.direction === 'INCOME') {
          stats[month].income += tx.amount;
        } else {
          stats[month].expense += tx.amount;
        }
      });

      // Convertimos a array para Recharts
      return Object.entries(stats).map(([month, values]) => ({
        month,
        income: values.income,
        expense: values.expense,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al generar estadísticas');
    }
  }
}

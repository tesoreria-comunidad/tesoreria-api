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

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll() {
    try {
      return await this.prisma.transactions.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
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
      throw new InternalServerErrorException('Error al obtener la transacción');
    }
  }

  async update(id: string, data: UpdateTransactionDTO) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');

      // Verificamos existencia antes de actualizar
      await this.findOne(id);

      return await this.prisma.transactions.update({
        where: { id },
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

  async remove(id: string) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');

      // Verificamos existencia antes de eliminar
      await this.findOne(id);

      return await this.prisma.transactions.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al eliminar la transacción',
      );
    }
  }
}

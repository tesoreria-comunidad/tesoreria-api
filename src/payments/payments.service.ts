import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreatePaymentDto) {
        try {
            return await this.prisma.payment.create({ data });
        } catch (error) {
            throw new InternalServerErrorException('Error al crear el pago');
        }
    }

    async findAll() {
        try {
            return await this.prisma.payment.findMany();
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener los pagos');
        }
    }

    async findOne(id: string) {
        try {
            if (!id) throw new BadRequestException('ID es requerido');

            const payment = await this.prisma.payment.findUnique({ where: { id } });

            if (!payment) throw new NotFoundException(`Pago con ID ${id} no encontrado`);

            return payment;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al obtener el pago');
        }
    }

    async update(id: string, data: UpdatePaymentDto) {
        try {
            if (!id) throw new BadRequestException('ID es requerido');

            // Verificamos que exista
            await this.findOne(id);

            return await this.prisma.payment.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al actualizar el pago');
        }
    }

    async remove(id: string) {
        try {
            if (!id) throw new BadRequestException('ID es requerido');

            // Verificamos que exista
            await this.findOne(id);

            return await this.prisma.payment.delete({ where: { id } });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al eliminar el pago');
        }
    }
}

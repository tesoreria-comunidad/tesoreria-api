import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { log } from 'console';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService, private roleFilterService: RoleFilterService) { }

    async create(data: CreatePaymentDto) {
        try {
            return await this.prisma.payment.create({ data });
        } catch (error) {
            console.log('Error al crear el pago', error);
            throw new InternalServerErrorException('Error al crear el pago');
        }
    }

    async findAll(loggedUser) {
        try {
            const where  =this.roleFilterService.apply(loggedUser);
            return await this.prisma.payment.findMany();
        } catch (error) {
            console.log('Error al obtener los pagos', error);
            throw new InternalServerErrorException('Error al obtener los pagos');
        }
    }

    async findOne(id: string, loggedUser: any) {
        try {
            if (!id) throw new BadRequestException('ID es requerido');
            const where = this.roleFilterService.apply(loggedUser);
            const payment = await this.prisma.payment.findUnique({ where });

            if (!payment) throw new NotFoundException(`Pago con ID ${id} no encontrado`);

            return payment;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.log('Error al obtener el pago', error);
            throw new InternalServerErrorException('Error al obtener el pago');
        }
    }

    async update(id: string, data: UpdatePaymentDto, loggedUser: any) {
        try {
            if (!id) throw new BadRequestException('ID es requerido');
            const where = this.roleFilterService.apply(loggedUser);
            // Verificamos que exista
            await this.findOne(id, loggedUser);

            return await this.prisma.payment.update({
                where,
                data,
            });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.log('Error al actualizar el pago', error);
            throw new InternalServerErrorException('Error al actualizar el pago');
        }
    }

    async remove(id: string, loggedUser: any) {
        try {
            if (!id) throw new BadRequestException('ID es requerido');
            const where = this.roleFilterService.apply(loggedUser)
            // Verificamos que exista
            await this.findOne(id, loggedUser);

            return await this.prisma.payment.delete({ where });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.log('Error al eliminar el pago', error);
            throw new InternalServerErrorException('Error al eliminar el pago');
        }
    }
}

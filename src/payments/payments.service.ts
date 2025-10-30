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
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        private roleFilterService: RoleFilterService,
        private actionLogsService: ActionLogsService,
    ) { }

    async create(data: CreatePaymentDto, loggedUser?: any, actorId?: string) {
        const userId = (actorId as string) ?? (loggedUser?.id as string);
        const log = await this.actionLogsService.start(
            ActionType.PAYMENT_CREATE,
            userId,
            { target_table: ActionTargetTable.TRANSACTIONS },
        );

        try {
            const created = await this.prisma.payment.create({ data });
            await this.actionLogsService.markSuccess(log.id, undefined, {
                target_id: created.id,
                payment: { id: created.id, amount: created.amount, id_family: created.id_family },
            });
            return created;
        } catch (error) {
            console.log('Error al crear el pago', error);
            await this.actionLogsService.markError(log.id, error as Error);
            throw new InternalServerErrorException('Error al crear el pago');
        }
    }

    async findAll(loggedUser, actorId?: string) {
        try {
            const where  =this.roleFilterService.apply(loggedUser);
            return await this.prisma.payment.findMany();
        } catch (error) {
            console.log('Error al obtener los pagos', error);
            throw new InternalServerErrorException('Error al obtener los pagos');
        }
    }

    async findOne(id: string, loggedUser: any, actorId?: string) {
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

    async update(id: string, data: UpdatePaymentDto, loggedUser: any, actorId?: string) {
        const userId = (actorId as string) ?? (loggedUser?.id as string);
        const log = await this.actionLogsService.start(
            ActionType.PAYMENT_UPDATE,
            userId,
            { target_table: ActionTargetTable.TRANSACTIONS, target_id: id },
        );

        try {
            if (!id) throw new BadRequestException('ID es requerido');
            const where = this.roleFilterService.apply(loggedUser);
            // Verificamos que exista
            await this.findOne(id, loggedUser);

            const updated = await this.prisma.payment.update({ where, data });

            await this.actionLogsService.markSuccess(log.id, undefined, {
                target_id: updated.id,
                payment: { id: updated.id, amount: updated.amount, id_family: updated.id_family },
            });

            return updated;
        } catch (error) {
            await this.actionLogsService.markError(log.id, error as Error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.log('Error al actualizar el pago', error);
            throw new InternalServerErrorException('Error al actualizar el pago');
        }
    }

    async remove(id: string, loggedUser: any, actorId?: string) {
        const userId = (actorId as string) ?? (loggedUser?.id as string);
        const log = await this.actionLogsService.start(
            ActionType.PAYMENT_DELETE,
            userId,
            { target_table: ActionTargetTable.TRANSACTIONS, target_id: id },
        );

        try {
            if (!id) throw new BadRequestException('ID es requerido');
            const where = this.roleFilterService.apply(loggedUser)
            // Verificamos que exista
            const existing = await this.findOne(id, loggedUser);

            const deleted = await this.prisma.payment.delete({ where });

            await this.actionLogsService.markSuccess(log.id, undefined, {
                deleted: { id: deleted.id, amount: deleted.amount },
                existing: { id: existing.id, amount: existing.amount },
            });

            return deleted;
        } catch (error) {
            await this.actionLogsService.markError(log.id, error as Error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.log('Error al eliminar el pago', error);
            throw new InternalServerErrorException('Error al eliminar el pago');
        }
    }
}

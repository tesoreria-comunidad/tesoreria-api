import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreatePaymentDto) {
        return this.prisma.payment.create({ data });
    }

    async findAll() {
        return this.prisma.payment.findMany();
    }

    async findOne(id: string) {
        return this.prisma.payment.findUnique({ where: { id } });
    }

    async update(id: string, data: UpdatePaymentDto) {
        return this.prisma.payment.update({ where: { id }, data });
    }

    async remove(id: string) {
        return this.prisma.payment.delete({ where: { id } });
    }
}

import { Injectable } from '@nestjs/common';
import { BalanceService } from 'src/balance/balance.service';
import { PrismaService } from 'src/prisma.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';

@Injectable()
export class FamilyService {
    constructor(
        private prisma: PrismaService,
        private balanceService: BalanceService
    ) { }

    async create(data: CreateFamilyDto) {
        const newBalance = await this.balanceService.create({});

        return this.prisma.family.create({
            data: {
                id_balance: newBalance.id,
                name: data.name,
                phone: data.phone,
            },
        });
    }

    async findAll() {
        return this.prisma.family.findMany();
    }

    async findOne(id: string) {
        return this.prisma.family.findUnique({ where: { id } });
    }

    async update(id: string, data: UpdateFamilyDto) {
        return this.prisma.family.update({ where: { id }, data });
    }

    async remove(id: string) {
        return this.prisma.family.delete({ where: { id } });
    }
}

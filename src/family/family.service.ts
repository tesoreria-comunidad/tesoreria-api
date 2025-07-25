import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
import { BalanceService } from 'src/balance/balance.service';
import { Family } from '@prisma/client';

@Injectable()
export class FamilyService {
    constructor(
        private prisma: PrismaService,
        private balanceService: BalanceService,
    ) { }

    public async create(data: CreateFamilyDto): Promise<Family> {
        try {
            const newBalance = await this.balanceService.create({
                cuota_balance: 0,
                cfa_balance: 0,
                custom_balance: 0,
                is_custom_cuota: false,
                is_custom_cfa: false,
            });


            return await this.prisma.family.create({
                data: {
                    id_balance: newBalance.id,
                    name: data.name,
                    phone: data.phone,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error al crear la familia');
        }
    }

    public async findAll(): Promise<Family[]> {
        try {
            return await this.prisma.family.findMany();
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener las familias');
        }
    }

    public async findOne(id: string): Promise<Family> {
        try {
            if (!id) {
                throw new BadRequestException('ID es requerido');
            }

            const family = await this.prisma.family.findUnique({
                where: { id },
            });

            if (!family) {
                throw new NotFoundException(`Familia con ID ${id} no encontrada`);
            }

            return family;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al obtener la familia');
        }
    }

    public async update(id: string, data: UpdateFamilyDto): Promise<Family> {
        try {
            if (!id) {
                throw new BadRequestException('ID es requerido');
            }

            await this.findOne(id); // asegura que existe

            return await this.prisma.family.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al actualizar la familia');
        }
    }

    public async remove(id: string): Promise<Family> {
        try {
            if (!id) {
                throw new BadRequestException('ID es requerido');
            }

            await this.findOne(id); // asegura que existe

            return await this.prisma.family.delete({
                where: { id },
            });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al eliminar la familia');
        }
    }

    public async findBy({
        key,
        value,
    }: {
        key: keyof Family;
        value: string | number;
    }): Promise<Family | null> {
        try {
            return await this.prisma.family.findFirst({
                where: { [key]: value },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error en la búsqueda de familia');
        }
    }
}
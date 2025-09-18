import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCuotaPorHermanosDto, UpdateCuotaPorHermanosDto } from './dto/cuota-por-hermanos.dto';

@Injectable()
export class CuotaPorHermanosService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCuotaPorHermanosDto) {
    // Evitar duplicados
    const exists = await this.prisma.cuotaPorHermanos.findFirst({ where: { cantidad: data.cantidad } });
    if (exists) throw new ConflictException('Ya existe una cuota para esa cantidad de hermanos');
    return this.prisma.cuotaPorHermanos.create({ data });
  }

  async findAll() {
    return this.prisma.cuotaPorHermanos.findMany({ orderBy: { cantidad: 'asc' } });
  }

  async findOne(id: string) {
    const cuota = await this.prisma.cuotaPorHermanos.findUnique({ where: { id } });
    if (!cuota) throw new NotFoundException('No encontrada');
    return cuota;
  }

  async update(id: string, data: UpdateCuotaPorHermanosDto) {
    await this.findOne(id); // Valida existencia
    return this.prisma.cuotaPorHermanos.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id); // Valida existencia
    return this.prisma.cuotaPorHermanos.delete({ where: { id } });
  }
}
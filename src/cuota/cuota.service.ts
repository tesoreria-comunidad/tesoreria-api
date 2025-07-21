import { Injectable } from '@nestjs/common';
import { PrismaClient, Cuota } from '@prisma/client';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';

@Injectable()
export class CuotaService {
  private prisma = new PrismaClient();

  public async getAllCuota() {
    return this.prisma.cuota.findMany();
  }

  public async getById(id: string) {
    return await this.prisma.cuota.findFirst({ 
      where: { id },
    });
  }

  public async create(data: CreateCuotaDTO) {
    return this.prisma.cuota.create({ 
      data,
    });
  }

  public async update(id: string, data: UpdateCuotaDTO) {
    return this.prisma.cuota.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string) {
    return this.prisma.cuota.delete({
      where: { id },
    });
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Cuota;
    value: string | number;
  }) {
    return this.prisma.cuota.findFirst({ where: { [key]: value } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaClient, Rama } from '@prisma/client';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';

@Injectable()
export class RamaService {
  private prisma = new PrismaClient();

  public async getAllRama() {
    return this.prisma.rama.findMany({
      include: {
        users: true,
      },
    });
  }

  public async getById(id: string) {
    return await this.prisma.rama.findFirst({ 
      where: { id },
      include: {
        users: true,
      },
    });
  }

  public async create(data: CreateRamaDTO) {
    return this.prisma.rama.create({ 
      data,
      include: {
        users: true,
      },
    });
  }

  public async update(id: string, data: UpdateRamaDTO) {
    return this.prisma.rama.update({
      where: { id },
      data,
      include: {
        users: true,
      },
    });
  }

  public async delete(id: string) {
    return this.prisma.rama.delete({
      where: { id },
    });
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Rama;
    value: string;
  }) {
    return this.prisma.rama.findFirst({ where: { [key]: value } });
  }
}

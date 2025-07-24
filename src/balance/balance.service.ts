import { Injectable } from '@nestjs/common';
import { PrismaClient, Balance } from '@prisma/client';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';

@Injectable()
export class BalanceService {
  private prisma = new PrismaClient();

  public async getAllBalances() {
    return this.prisma.balance.findMany({
      include: {
        family: true,
      },
    });
  }

  public async getById(id: string) {
    return await this.prisma.balance.findFirst({
      where: { id },
      include: {
        family: true,
      },
    });
  }

  public async create(data: CreateBalanceDTO) {
    return this.prisma.balance.create({
      data,
      include: {
        family: true,
      },
    });
  }

  public async update(id: string, data: UpdateBalanceDTO) {
    return this.prisma.balance.update({
      where: { id },
      data,
      include: {
        family: true,
      },
    });
  }

  public async delete(id: string) {
    return this.prisma.balance.delete({
      where: { id },
    });
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Balance;
    value: string | number | boolean;
  }) {
    return this.prisma.balance.findFirst({ where: { [key]: value } });
  }
}

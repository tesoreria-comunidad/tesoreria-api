import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  // constructor(private prisma: PrismaService) { };
  private prisma = new PrismaClient();

  public async getAllUser() {
    return this.prisma.user.findMany();
  }
  public async getById(id: string) {
    return await this.prisma.user.findFirst({ where: { id } });
  }
  public async create(data: User) {
    return this.prisma.user.create({ data });
  }
  public async findBy({
    key,
    value,
  }: {
    key: keyof User;
    value: string | number;
  }) {
    return this.prisma.user.findFirst({ where: { [key]: value } });
  }
}

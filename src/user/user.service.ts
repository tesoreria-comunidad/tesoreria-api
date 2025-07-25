import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserDTO, CreateUserDTO } from './dto/user.dto';
import { removeUndefined } from 'src/utils/remove-undefined.util';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  public async getAllUser() {
    return this.prisma.user.findMany();
  }

  public async getById(id: string) {
    return await this.prisma.user.findFirst({ where: { id } });
  }

  public async create(data: CreateUserDTO | User) {
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

  public async update(id: string, data: UpdateUserDTO) {
    const cleanData = removeUndefined(data); // helper para eliminar campos undefined

    return this.prisma.user.update({
      where: { id },
      data: cleanData,
    });
  }

  public async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

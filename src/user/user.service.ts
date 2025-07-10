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
  public async create(data: User) {
    return this.prisma.user.create({ data });
  }
}

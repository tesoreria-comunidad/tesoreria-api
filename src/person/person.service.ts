import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Person, Prisma } from '@prisma/client';

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async getAllPersons(): Promise<Person[]> {
    return this.prisma.person.findMany({
      include: {
        user: true,
        family: true,
      },
    });
  }

  async getById(id: string): Promise<Person | null> {
    return this.prisma.person.findUnique({
      where: { id },
      include: {
        user: true,
        family: true,
      },
    });
  }

  async create(data: Prisma.PersonCreateInput): Promise<Person> {
    return this.prisma.person.create({
      data,
      include: {
        user: true,
        family: true,
      },
    });
  }

  async update(id: string, data: Prisma.PersonUpdateInput): Promise<Person> {
    return this.prisma.person.update({
      where: { id },
      data,
      include: {
        user: true,
        family: true,
      },
    });
  }

  async delete(id: string): Promise<Person> {
    return this.prisma.person.delete({
      where: { id },
    });
  }

  async findByDni(dni: string): Promise<Person | null> {
    return this.prisma.person.findFirst({
      where: { dni },
      include: {
        user: true,
        family: true,
      },
    });
  }
}

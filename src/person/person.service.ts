import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Person } from '@prisma/client';
import { CreatePersonDTO } from './dto/create-person.dto';
import { UpdatePersonDTO } from './dto/update-person.dto';
import { removeUndefined } from '../utils/remove-undefined.util';

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

  async create(data: CreatePersonDTO): Promise<Person> {
    return this.prisma.person.create({
      data,
      include: {
        user: true,
        family: true,
      },
    });
  }

  async update(id: string, data: UpdatePersonDTO): Promise<Person> {
    const cleanData = removeUndefined(data);
    return this.prisma.person.update({
      where: { id },
      data: cleanData,
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

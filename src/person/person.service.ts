import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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

  async bulkCreate(persons: CreatePersonDTO[]): Promise<Person[]> {
    try {
      const existing = await this.prisma.person.findMany({
        where: {
          OR: [
            { email: { in: persons.map((p) => p.email) } },
            { dni: { in: persons.map((p) => p.dni) } },
          ],
        },
        select: { email: true, dni: true },
      });

      if (existing.length > 0) {
        throw new BadRequestException(
          `Ya existen personas con los siguientes emails o DNIs: ${existing
            .map((e) => [e.email, e.dni].filter(Boolean).join(' / '))
            .join(', ')}`,
        );
      }
      await this.prisma.person.createMany({
        data: persons,
        skipDuplicates: true,
      });

      // Fetch and return the created persons with relations
      return this.prisma.person.findMany({
        include: {
          user: true,
          family: true,
        },
      });
    } catch (error) {
      console.log('error at persons bulk create', error);
      throw new InternalServerErrorException(
        `Error in persons bulkCreate: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

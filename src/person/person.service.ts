import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Person } from '@prisma/client';
import { CreatePersonDTO } from './dto/create-person.dto';
import { UpdatePersonDTO } from './dto/update-person.dto';
import { removeUndefined } from '../utils/remove-undefined.util';
import * as bcrypt from 'bcrypt';
@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async getAllPersons(): Promise<Person[]> {
    return this.prisma.person.findMany();
  }

  async getById(id: string): Promise<Person | null> {
    return this.prisma.person.findUnique({
      where: { id },
    });
  }

  async create(data: CreatePersonDTO): Promise<Person> {
    return this.prisma.person.create({
      data,
    });
  }

  async update(id: string, data: UpdatePersonDTO): Promise<Person> {
    const cleanData = removeUndefined(data);
    return this.prisma.person.update({
      where: { id },
      data: cleanData,
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
    });
  }

  // async bulkCreate(data: {
  //   persons: CreatePersonDTO[];
  //   id_rama?: string;
  // }): Promise<Person[]> {
  //   const { persons, id_rama } = data;
  //   try {
  //     const existing = await this.prisma.person.findMany({
  //       where: {
  //         OR: [
  //           { email: { in: persons.map((p) => p.email) } },
  //           { dni: { in: persons.map((p) => p.dni) } },
  //         ],
  //       },
  //       select: { email: true, dni: true },
  //     });

  //     if (existing.length > 0) {
  //       throw new BadRequestException(
  //         `Ya existen personas con los siguientes emails o DNIs: ${existing
  //           .map((e) => [e.email, e.dni].filter(Boolean).join(' / '))
  //           .join(', ')}`,
  //       );
  //     }
  //     await this.prisma.person.createMany({
  //       data: persons,
  //       skipDuplicates: true,
  //     });

  //     // Fetch and return the created persons with relations
  //     return this.prisma.person.findMany({
  //       include: {
  //         user: true,
  //         family: true,
  //       },
  //     });
  //   } catch (error) {
  //     console.log('error at persons bulk create', error);
  //     throw new InternalServerErrorException(
  //       `Error in persons bulkCreate: ${error instanceof Error ? error.message : String(error)}`,
  //     );
  //   }
  // }
  async bulkCreate(data: {
    persons: CreatePersonDTO[];
    id_rama?: string;
  }): Promise<Person[]> {
    const { persons, id_rama } = data;

    try {
      if (id_rama) {
        const existRama = await this.prisma.rama.findFirst({
          where: { id: id_rama },
        });
        if (!existRama) {
          throw new NotFoundException(
            `No existe la rama con el valor de ${id_rama}`,
          );
        }
      }
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

      // Creamos personas una por una para obtener sus IDs
      const createdPersons = await Promise.all(
        persons.map((person) =>
          this.prisma.person.create({
            data: person,
          }),
        ),
      );

      // Devolvemos las personas creadas con relaciones
      return this.prisma.person.findMany({
        where: {
          id: { in: createdPersons.map((p) => p.id) },
        },
      });
    } catch (error) {
      console.log('error at persons bulk create', error);
      throw new InternalServerErrorException(
        `Error in persons bulkCreate: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

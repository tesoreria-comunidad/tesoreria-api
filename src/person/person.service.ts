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
import { RoleFilterService } from 'src/services/RoleFilter.service';
@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService, private roleFilterService: RoleFilterService) {}

  async getAllPersons(loggedUser : any): Promise<Person[]> {
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return this.prisma.person.findMany({
        where
      });
    } catch (error) {
      console.log('Error al obtener las personas:', error);
      throw new InternalServerErrorException('Error al obtener las personas');
    }
  }

  async getById(id: string, loggedUser: any): Promise<Person | null> {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      return this.prisma.person.findUnique({
        where,
      });
    } catch (error) {
      console.log('Error al obtener la persona:', error);
      throw new InternalServerErrorException('Error al obtener la persona');
    }
    
  }

  async create(data: CreatePersonDTO): Promise<Person> {
    try {    
      return this.prisma.person.create({
      data,
    });
    } catch (error) {
      console.log('Error al crear la persona:', error);
      throw new InternalServerErrorException('Error al crear la persona');
    }
  }

  async update(id: string, data: UpdatePersonDTO, loggedUser: any): Promise<Person> {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      const cleanData = removeUndefined(data);
      return this.prisma.person.update({
        where,
        data: cleanData,
      });
    } catch (error) {
      console.log('Error al actualizar la persona:', error);
      throw new InternalServerErrorException('Error al actualizar la persona');
    }
    
  }

  async delete(id: string, loggedUser: any): Promise<Person> {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      return this.prisma.person.delete({
        where,
      });
    } catch (error) {
      console.log('Error al eliminar la persona:', error);
      throw new InternalServerErrorException('Error al eliminar la persona');
    }
  }

  async findByDni(dni: string, loggedUser: any): Promise<Person | null> {
    try {
      if (!dni) {
      throw new BadRequestException('DNI es requerido');
    }
      const where = this.roleFilterService.apply(loggedUser);
      return this.prisma.person.findFirst({ where });
    } catch (error) {
      console.log('Error en la búsqueda por DNI:', error);
      throw new InternalServerErrorException('Error en la búsqueda por DNI');
    }
  }

  async bulkCreate(data: {
    persons: CreatePersonDTO[];
    id_rama?: string;
  }, loggedUser: any): Promise<Person[]> {
    const { persons, id_rama } = data;
    const where = this.roleFilterService.apply(loggedUser);
    try {
      if (id_rama) {
        const existRama = await this.prisma.rama.findFirst({
          where,
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
        `Error in persons bulkCreate: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

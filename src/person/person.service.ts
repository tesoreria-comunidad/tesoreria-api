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
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';
import { Request as ExpressRequest } from 'express';


@Injectable()
export class PersonService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private actionLogsService: ActionLogsService,
  ) {}
  // Actor resolution is centralized in ActionLogsService.resolveActor

  async getAllPersons(reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person[]> {
    const loggedUser = reqOrActor && typeof reqOrActor !== 'string' ? (reqOrActor as any).user : undefined;
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return this.prisma.person.findMany({
        where,
      });
    } catch (error) {
      console.log('Error al obtener las personas:', error);
      throw new InternalServerErrorException('Error al obtener las personas');
    }
  }

  async getById(id: string, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person | null> {
    const loggedUser = reqOrActor && typeof reqOrActor !== 'string' ? (reqOrActor as any).user : undefined;
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
      const where = this.roleFilterService.apply(loggedUser);
      return this.prisma.person.findUnique({ where });
    } catch (error) {
      console.log('Error al obtener la persona:', error);
      throw new InternalServerErrorException('Error al obtener la persona');
    }
    
  }

  async create(data: CreatePersonDTO, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person> {
    const { log, loggedUser } = await this.actionLogsService.start(
      ActionType.PERSON_CREATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER },
    );

    try {
      const created = await this.prisma.person.create({ data });
      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: created.id,
        person: {
          id: created.id,
          name: created.name,
          last_name: created.last_name,
          email: created.email,
          dni: created.dni,
        },
      });
      return created;
    } catch (error) {
      console.log('Error al crear la persona:', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException('Error al crear la persona');
    }
  }

  async update(id: string, data: UpdatePersonDTO, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person> {
    const { log, loggedUser } = await this.actionLogsService.start(
      ActionType.PERSON_UPDATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER, target_id: id },
    );

    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
  const where = this.roleFilterService.apply(loggedUser);
      const cleanData = removeUndefined(data);
      const updated = await this.prisma.person.update({ where, data: cleanData });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: updated.id,
        person: {
          id: updated.id,
          name: updated.name,
          last_name: updated.last_name,
          email: updated.email,
          dni: updated.dni,
        },
      });

      return updated;
    } catch (error) {
      console.log('Error al actualizar la persona:', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException('Error al actualizar la persona');
    }
    
  }

  async delete(id: string, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person> {
    const { log, loggedUser } = await this.actionLogsService.start(
      ActionType.PERSON_DELETE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER, target_id: id },
    );

    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }
  const where = this.roleFilterService.apply(loggedUser);
  const deleted = await this.prisma.person.delete({ where });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        deleted: { id: deleted.id, name: deleted.name, email: deleted.email },
      });

      return deleted;
    } catch (error) {
      console.log('Error al eliminar la persona:', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException('Error al eliminar la persona');
    }
  }

  async findByDni(dni: string, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person | null> {
    const loggedUser = reqOrActor && typeof reqOrActor !== 'string' ? (reqOrActor as any).user : undefined;
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
  }, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Person[]> {
    const { persons, id_rama } = data;
    const { log, loggedUser } = await this.actionLogsService.start(
      ActionType.PERSON_CREATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER },
    );
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
      const found = await this.prisma.person.findMany({
        where: {
          id: { in: createdPersons.map((p) => p.id) },
        },
      });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        createdCount: found.length,
      });

      return found;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      console.log('error at persons bulk create', error);
      throw new InternalServerErrorException(
        `Error in persons bulkCreate: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

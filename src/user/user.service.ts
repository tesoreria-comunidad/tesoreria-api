import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import {
  UpdateUserDTO,
  CreateUserDTO,
  BulkCreateUserDTO,
  BulkUpdateRamaDTO,
  UpdateUserRamaDTO,
} from './dto/user.dto';
import { removeUndefined } from 'src/utils/remove-undefined.util';
import { PrismaService } from 'src/prisma.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { Request as ExpressRequest } from 'express';
// AuthService not needed here; actor resolution is centralized in ActionLogsService

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
    private actionLogsService: ActionLogsService,
  ) {}

  // Actor resolution is centralized in ActionLogsService.resolveActor(reqOrActor)

  public async getAllUser(reqOrActor?: ExpressRequest | 'SYSTEM') {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    try {
      return await this.prisma.user.findMany({
        include: {
          folder: true,
          rama: true,
          family: true,
        },
      });
    } catch (error) {
      console.log('Error al obtener los usuarios: ', error);
      throw new InternalServerErrorException('Error al obtener los usuarios');
    }
  }

  public async getUsersByRama(id_rama: string) {
    try {
      if (!id_rama) throw new BadRequestException('ID de rama es requerido');
      return await this.prisma.user.findMany({
        where: { id_rama },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.log('Error al obtener usuarios por rama', error);
      throw new InternalServerErrorException(
        'Error al obtener usuarios por rama',
      );
    }
  }

  public async getById(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const where = this.roleFilterService.apply(loggedUser, { id });
      const user = await this.prisma.user.findFirst({
        where: { id },
        include: { rama: true, folder: true, family: true },
      });
      if (!user)
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      return user;
    } catch (error) {
      console.log('Error al obtener usuario por ID', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Error al obtener el usuario');
    }
  }

  public async create(
    data: CreateUserDTO,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    const { log } = await this.actionLogsService.start(
      ActionType.USER_CREATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER },
    );

    try {
      // Verificar si ya existe un usuario con el mismo username
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: { username: data.username },
      });

      if (existingUserByUsername) {
        throw new ConflictException(
          'Ya existe un usuario con ese nombre de usuario',
        );
      }

      if (data.email) {
        // Verificar si ya existe un usuario con el mismo email
        const existingUserByEmail = await this.prisma.user.findFirst({
          where: { email: data.email },
        });

        if (existingUserByEmail) {
          throw new ConflictException('Ya existe un usuario con ese email');
        }
      }

      if (data.dni) {
        // Verificar si ya existe un usuario con el mismo DNI
        const existingUserByDNI = await this.prisma.user.findFirst({
          where: { dni: data.dni },
        });

        if (existingUserByDNI) {
          throw new ConflictException('Ya existe un usuario con ese DNI');
        }
      }

      // Verificar que la rama existe si se proporciona
      if (data.id_rama) {
        const ramaExists = await this.prisma.rama.findFirst({
          where: { id: data.id_rama },
        });
        if (!ramaExists) {
          throw new BadRequestException('La rama especificada no existe');
        }
      }

      // Verificar que la carpeta existe si se proporciona
      if (data.id_folder) {
        const folderExists = await this.prisma.folder.findFirst({
          where: { id: data.id_folder },
        });
        if (!folderExists) {
          throw new BadRequestException('La carpeta especificada no existe');
        }
      }

      // Verificar que la familia existe si se proporciona
      if (data.id_family) {
        const familyExists = await this.prisma.family.findFirst({
          where: { id: data.id_family },
        });
        if (!familyExists) {
          throw new BadRequestException('La familia especificada no existe');
        }
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(
        data.password,
        +process.env.HASH_SALT || 10,
      );

      // Preparar datos limpios para la creación
      const cleanData = {
        username: data.username,
        name: data.name,
        last_name: data.last_name,
        address: data.address,
        phone: data.phone,
        email: data.email?.toLowerCase(),
        dni: data.dni,
        citizenship: data.citizenship,
        password: hashedPassword,
        birthdate: data.birthdate,
        gender: data.gender,
        role: data.role,
        family_role: data.family_role || 'MEMBER', // Por defecto MEMBER si no se especifica
        id_folder: data.id_folder,
        id_rama: data.id_rama,
        id_family: data.id_family,
      };

      const created = await this.prisma.user.create({
        data: cleanData,
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: created.id,
        user: {
          id: created.id,
          username: created.username,
          name: created.name,
          last_name: created.last_name,
          email: created.email,
        },
      });

      return created;
    } catch (error) {
      console.log('Error al crear usuario', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  public async findBy(
    { key, value }: { key: keyof User; value: string | number },
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    try {
      const where = this.roleFilterService.apply(loggedUser, { [key]: value });
      return await this.prisma.user.findFirst({
        where,
        include: { rama: true, folder: true, family: true },
      });
    } catch (error) {
      console.log('Error en la búsqueda de usuario', error);
      throw new InternalServerErrorException('Error en la búsqueda de usuario');
    }
  }

  public async update(
    id: string,
    data: UpdateUserDTO,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    const { log } = await this.actionLogsService.start(
      ActionType.USER_UPDATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER, target_id: id },
    );

    try {
      if (!id) throw new BadRequestException('ID es requerido');

      // Verificar que el usuario existe
      await this.getById(id, reqOrActor);

      // Si se actualiza username, verificar que no exista otro usuario con el mismo
      if (data.username) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            username: data.username.trim(),
            NOT: { id: id },
          },
        });
        if (existingUser)
          throw new ConflictException(
            'Ya existe otro usuario con ese nombre de usuario',
          );
      }

      // Si se actualiza email, verificar que no exista otro usuario con el mismo
      if (data.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email: data.email.trim().toLowerCase(),
            NOT: { id: id },
          },
        });
        if (existingUser)
          throw new ConflictException('Ya existe otro usuario con ese email');
      }

      // Si se actualiza DNI, verificar que no exista otro usuario con el mismo
      if (data.dni) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            dni: data.dni.trim(),
            NOT: { id: id },
          },
        });
        if (existingUser)
          throw new ConflictException('Ya existe otro usuario con ese DNI');
      }

      // Verificar que la carpeta existe si se proporciona
      if (data.id_folder) {
        const folderExists = await this.prisma.folder.findFirst({
          where: { id: data.id_folder },
        });
        if (!folderExists)
          throw new BadRequestException('La carpeta especificada no existe');
      }

      // Verificar que la familia existe si se proporciona
      if (data.id_family) {
        const familyExists = await this.prisma.family.findFirst({
          where: { id: data.id_family },
        });
        if (!familyExists)
          throw new BadRequestException('La familia especificada no existe');
      }

      const cleanData = removeUndefined(data);

      // Limpiar strings si existen
      if (cleanData.username) cleanData.username = cleanData.username.trim();
      if (cleanData.name) cleanData.name = cleanData.name.trim();
      if (cleanData.last_name) cleanData.last_name = cleanData.last_name.trim();
      if (cleanData.address) cleanData.address = cleanData.address.trim();
      if (cleanData.phone) cleanData.phone = cleanData.phone.trim();
      if (cleanData.email)
        cleanData.email = cleanData.email.trim().toLowerCase();
      if (cleanData.dni) cleanData.dni = cleanData.dni.trim();
      if (cleanData.citizenship)
        cleanData.citizenship = cleanData.citizenship.trim();

      // Hash de la contraseña si se proporciona
      if (cleanData.password) {
        cleanData.password = await bcrypt.hash(
          cleanData.password,
          +process.env.HASH_SALT || 10,
        );
      }

      const updated = await this.prisma.user.update({
        where: { id },
        data: cleanData,
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });

      const safeUser = {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        last_name: updated.last_name,
        email: updated.email,
        id_family: updated.id_family ?? null,
        id_rama: updated.id_rama ?? null,
        id_folder: updated.id_folder ?? null,
        role: updated.role ?? null,
        family_role: updated.family_role ?? null,
      };

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: updated.id,
        user: safeUser,
      });

      return updated;
    } catch (error) {
      console.log('Error al actualizar usuario', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el usuario');
    }
  }

  public async delete(id: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    const { log } = await this.actionLogsService.start(
      ActionType.USER_DELETE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER, target_id: id },
    );

    try {
      if (!id) throw new BadRequestException('ID es requerido');
      await this.getById(id, reqOrActor);

      const deleted = await this.prisma.user.delete({ where: { id } });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        deletedUser: {
          id: deleted.id,
          username: deleted.username,
          name: deleted.name,
          last_name: deleted.last_name,
          email: deleted.email,
        },
      });

      return deleted;
    } catch (error) {
      console.log('Error al eliminar usuario', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Error al eliminar el usuario');
    }
  }

  public async bulkCreate(
    users: BulkCreateUserDTO[],
    id_rama: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    const { log } = await this.actionLogsService.start(
      ActionType.USER_CREATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER },
    );

    try {
      if (!loggedUser) throw new BadRequestException('Actor required');
      // Si no es MASTER o DIRIGENTE, se bloquea la creacion
      if (loggedUser.role === 'BENEFICIARIO') {
        throw new BadRequestException('No tiene permisos para creación masiva');
      }

      // Si es DIRIGENTE, forzar id_rama a la suya
      if (loggedUser.role === 'DIRIGENTE') {
        if (!loggedUser.id_rama)
          throw new BadRequestException('Actor tiene id_rama nulo');
        id_rama = loggedUser.id_rama;
      }

      if (!Array.isArray(users) || users.length === 0) {
        throw new BadRequestException(
          'Debe proporcionar una lista de usuarios',
        );
      }
      // Validación de emails existentes
      const emails = users.map((u) => u.email?.toLowerCase()).filter(Boolean);
      if (emails.length > 0) {
        const existingEmails = await this.prisma.user.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        });

        if (existingEmails.length > 0) {
          const conflicts = existingEmails.map((u) => u.email);
          throw new ConflictException(
            `Ya existen usuarios con los siguientes emails: ${conflicts.join(', ')}`,
          );
        }
      }

      // Validación de DNIs existentes
      const dnis = users.map((u) => u.dni).filter(Boolean);
      if (dnis.length > 0) {
        const existingDNIs = await this.prisma.user.findMany({
          where: { dni: { in: dnis } },
          select: { dni: true },
        });

        if (existingDNIs.length > 0) {
          const conflicts = existingDNIs.map((u) => u.dni);
          throw new ConflictException(
            `Ya existen usuarios con los siguientes DNIs: ${conflicts.join(', ')}`,
          );
        }
      }

      // Verificar que la rama existe si se proporciona
      if (id_rama) {
        const ramaExists = await this.prisma.rama.findFirst({
          where: { id: id_rama },
        });
        if (!ramaExists) {
          throw new BadRequestException('La rama especificada no existe');
        }
      }

      let finalData: CreateUserDTO;

      // Generar username y password automaticamente para cada usuario
      const generatedUsernames = new Set<string>();
      for (const user of users) {
        // Crear la base a partir del name y last_name
        const base = `${user.name.toLowerCase().trim()}.${user.last_name.toLowerCase().trim()}`;
        let candidate = base;
        let counter = 1;

        // Verificar en la base de datos y en los usuarios ya generados localmente para asegurar unicidad
        while (
          generatedUsernames.has(candidate) ||
          (await this.prisma.user.findFirst({ where: { username: candidate } }))
        ) {
          candidate = `${base}.${counter}`;
          counter++;
        }

        generatedUsernames.add(candidate);
        user.username = candidate;
        user.password = candidate;
      }

      const familyIdentifiers = [
        ...new Set(users.map((u) => u.family_id || u.last_name)),
      ];
      const familiesMap: Record<string, string> = {}; // [name]: id
      for (const familyName of familyIdentifiers) {
        const family = await this.findOrCreateFamilyGroup(familyName, id_rama);
        if (family) {
          familiesMap[familyName] = family.id;
        }
      }

      // Hashear contraseñas y limpiar datos
      const usersWithHashedPasswords = await Promise.all(
        users.map(async (user) => {
          const familyKey = user.family_id || user.last_name;
          const familyId = familiesMap[familyKey];
          const {
            address,
            citizenship,
            dni,
            email,
            gender,
            id_folder,
            last_name,
            name,
            phone,
            role,
            family_role,
          } = user;
          return {
            address,
            citizenship,
            dni,
            email,
            gender,
            id_folder,
            last_name,
            name,
            phone,
            role,
            family_role,
            username: user.username.trim(),
            password: await bcrypt.hash(
              user.password,
              +process.env.HASH_SALT || 10,
            ),
            birthdate: user.birthdate ? user.birthdate : null,
            id_rama: id_rama ? id_rama : null,
            id_family: familyId ? familyId : null,
          };
        }),
      );

      const result = await this.prisma.user.createMany({
        data: usersWithHashedPasswords,
        skipDuplicates: true,
      });

      await this.actionLogsService.markSuccess(
        log.id,
        `${result.count} usuarios creados en lote`,
        {
          createdCount: result.count,
        },
      );

      return result;
    } catch (error) {
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('Error bulkCreate users:', error);
      throw new InternalServerErrorException('Error al crear usuarios en lote');
    }
  }

  public async bulkUpdateRama(
    dto: BulkUpdateRamaDTO,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    const { log } = await this.actionLogsService.start(
      ActionType.USER_UPDATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER },
    );

    try {
      if (!loggedUser) throw new BadRequestException('Actor requerido');

      const { user_ids, id_rama_destino } = dto;

      // Verificar que la rama destino existe
      const ramaDestino = await this.prisma.rama.findUnique({
        where: { id: id_rama_destino },
      });
      if (!ramaDestino) {
        throw new NotFoundException(
          `La rama destino con ID ${id_rama_destino} no existe`,
        );
      }

      // Verificar que todos los usuarios existen
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: user_ids } },
        select: { id: true, name: true, last_name: true, id_rama: true },
      });

      if (existingUsers.length !== user_ids.length) {
        const foundIds = new Set(existingUsers.map((u) => u.id));
        const missing = user_ids.filter((id) => !foundIds.has(id));
        throw new NotFoundException(
          `Los siguientes usuarios no fueron encontrados: ${missing.join(', ')}`,
        );
      }

      // Validación de custodia para DIRIGENTE: solo puede mover usuarios de su propia rama
      if (loggedUser.role === 'DIRIGENTE') {
        if (!loggedUser.id_rama) {
          throw new ForbiddenException(
            'El DIRIGENTE no tiene una rama asignada',
          );
        }
        const usersFromOtherRama = existingUsers.filter(
          (u) => u.id_rama !== loggedUser.id_rama,
        );
        if (usersFromOtherRama.length > 0) {
          const forbidden = usersFromOtherRama.map((u) => u.id);
          throw new ForbiddenException(
            `No tiene permisos para mover usuarios de otra rama: ${forbidden.join(', ')}`,
          );
        }
      }

      // Capturar id_rama previo por usuario para el ActionLog
      const previousRamaByUser = existingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        last_name: u.last_name,
        id_rama_previo: u.id_rama,
      }));

      // Operación atómica: actualizar todos los usuarios en una transacción
      const updatedUsers = await this.prisma.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { id: { in: user_ids } },
          data: { id_rama: id_rama_destino },
        });

        return tx.user.findMany({
          where: { id: { in: user_ids } },
          select: { id: true, name: true, last_name: true, id_rama: true },
          orderBy: { name: 'asc' },
        });
      });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        id_rama_destino,
        rama_destino_name: ramaDestino.name,
        updated_count: updatedUsers.length,
        user_ids_afectados: user_ids,
        cambios_por_usuario: previousRamaByUser,
      });

      return {
        updated_count: updatedUsers.length,
        users: updatedUsers,
      };
    } catch (error) {
      console.log('Error en reasignación masiva de rama', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al reasignar usuarios a la nueva rama',
      );
    }
  }

  public async transferRama(
    id: string,
    dto: UpdateUserRamaDTO,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    const { log } = await this.actionLogsService.start(
      ActionType.USER_UPDATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.USER, target_id: id },
    );

    try {
      if (!id) throw new BadRequestException('ID es requerido');
      if (!loggedUser) throw new BadRequestException('Actor requerido');

      // Solo MASTER y DIRIGENTE pueden ejecutar traspasos
      if (loggedUser.role === 'FAMILY' || loggedUser.role === 'BENEFICIARIO') {
        throw new ForbiddenException('No tiene permisos para realizar traspasos de rama');
      }

      // Obtener usuario objetivo
      const usuario = await this.prisma.user.findFirst({
        where: { id },
        include: { rama: true },
      });
      if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

      // DIRIGENTE solo puede traspasar beneficiarios de su propia rama
      if (loggedUser.role === 'DIRIGENTE') {
        if (!loggedUser.id_rama) {
          throw new ForbiddenException('El DIRIGENTE no tiene una rama asignada');
        }
        if (usuario.id_rama !== loggedUser.id_rama) {
          throw new ForbiddenException(
            'Solo puede traspasar beneficiarios de su propia rama',
          );
        }
      }

      // Obtener rama destino
      const ramaDestino = await this.prisma.rama.findFirst({
        where: { id: dto.id_rama },
      });
      if (!ramaDestino) {
        throw new BadRequestException('La rama destino especificada no existe');
      }

      // Validar que el usuario tiene rama actual asignada
      if (!usuario.id_rama) {
        throw new BadRequestException(
          'El usuario no tiene una rama actual asignada. Use el endpoint de actualización general para asignar la rama inicial.',
        );
      }

      // Obtener rama origen
      const ramaOrigen = await this.prisma.rama.findFirst({
        where: { id: usuario.id_rama },
      });
      if (!ramaOrigen) {
        throw new BadRequestException('La rama actual del usuario no fue encontrada');
      }

      // Validar que origen y destino son del mismo grupo
      if (ramaOrigen.grupo !== ramaDestino.grupo) {
        throw new BadRequestException(
          'La rama destino debe pertenecer al mismo grupo que la rama actual',
        );
      }

      if (ramaDestino.id === ramaOrigen.id) {
        throw new BadRequestException(
          'La rama destino debe ser distinta a la rama actual',
        );
      }

      const ahora = new Date();

      // Ejecutar transacción Prisma
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Cerrar registro activo en UserRamaHistory (si existe)
        await tx.userRamaHistory.updateMany({
          where: { id_user: id, fecha_egreso: null },
          data: { fecha_egreso: ahora },
        });

        // Crear nuevo registro en UserRamaHistory
        await tx.userRamaHistory.create({
          data: {
            id_user: id,
            id_rama: dto.id_rama,
            id_rama_anterior: usuario.id_rama,
            fecha_ingreso: ahora,
            fecha_egreso: null,
          },
        });

        // Actualizar User.id_rama
        return tx.user.update({
          where: { id },
          data: { id_rama: dto.id_rama },
          include: { rama: true, folder: true, family: true },
        });
      });

      await this.actionLogsService.markSuccess(log.id, 'Traspaso de rama exitoso', {
        target_id: id,
        id_rama_origen: ramaOrigen.id,
        nombre_rama_origen: ramaOrigen.name,
        id_rama_destino: ramaDestino.id,
        nombre_rama_destino: ramaDestino.name,
        fecha_traspaso: ahora.toISOString(),
      });

      return updatedUser;
    } catch (error) {
      console.log('Error en traspaso de rama', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al traspasar al usuario de rama');
    }
  }

  public async getRamaHistory(
    id: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    if (!loggedUser) throw new BadRequestException('Actor requerido');

    // Solo MASTER y DIRIGENTE pueden ver el historial
    if (loggedUser.role === 'FAMILY' || loggedUser.role === 'BENEFICIARIO') {
      throw new ForbiddenException('No tiene permisos para ver el historial de ramas');
    }

    try {
      if (!id) throw new BadRequestException('ID es requerido');

      // Verificar que el usuario existe
      const usuario = await this.prisma.user.findFirst({ where: { id } });
      if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

      // DIRIGENTE solo puede ver historial de beneficiarios de su rama
      if (loggedUser.role === 'DIRIGENTE') {
        if (!loggedUser.id_rama) {
          throw new ForbiddenException('El DIRIGENTE no tiene una rama asignada');
        }
        if (usuario.id_rama !== loggedUser.id_rama) {
          throw new ForbiddenException(
            'Solo puede ver el historial de beneficiarios de su propia rama',
          );
        }
      }

      return await this.prisma.userRamaHistory.findMany({
        where: { id_user: id },
        include: {
          rama: true,
          ramaAnterior: true,
        },
        orderBy: { fecha_ingreso: 'desc' },
      });
    } catch (error) {
      console.log('Error al obtener historial de ramas', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el historial de ramas');
    }
  }

  private async findOrCreateFamilyGroup(name: string, ramaId: string) {
    try {
      console.log('CASO DE GRUPO FAMILIAR: ', name);
      const searchFamily = await this.prisma.family.findFirst({
        where: {
          name,
        },
      });

      if (searchFamily) {
        console.log('FAMILIA CREADA Y RETORANADA ', {
          ID: searchFamily.id,
          NAME: searchFamily.name,
        });
        return searchFamily;
      } // usamos la familia creada para asignarla  al 2 usuario con el mismo familiId del csv.
      const newBalance = await this.prisma.balance.create({
        data: {
          value: 0,
          cfa_balance_value: 0,
          custom_cuota: 0,
          custom_cfa_value: 0,
          is_custom_cuota: false,
          is_custom_cfa: false,
        },
      });

      console.log('CREAMOS GRUPO FAMILIAR: ', name);
      return await this.prisma.family.create({
        data: {
          manage_by: ramaId,
          name,
          phone: '',
          id_balance: newBalance.id,
        },
      });
    } catch (error) {
      console.error('Error creating family:', error);
    }
  }
  private async createDefaultFamily(name: string, ramaId: string) {
    try {
      const searchFamily = await this.prisma.family.findFirst({
        where: {
          name: name,
        },
      });

      let familyName = name;
      if (searchFamily) {
        let counter = 1;
        let newFamilyName = `${name.trim()}-${counter}`;
        while (
          await this.prisma.family.findFirst({ where: { name: newFamilyName } })
        ) {
          counter++;
          newFamilyName = `${name.trim()}-${counter}`;
        }
        familyName = newFamilyName;
      }
      const newBalance = await this.prisma.balance.create({
        data: {
          value: 0,
          cfa_balance_value: 0,
          custom_cuota: 0,
          custom_cfa_value: 0,
          is_custom_cuota: false,
          is_custom_cfa: false,
        },
      });

      return await this.prisma.family.create({
        data: {
          manage_by: ramaId,
          name: familyName,
          phone: '',
          id_balance: newBalance.id,
        },
      });
    } catch (error) {
      console.error('Error creating family:', error);
    }
  }
  public async getUsersByFamily(
    familyId: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    if (!loggedUser) throw new BadRequestException('Actor required');
    try {
      if (!familyId)
        throw new BadRequestException('ID de familia es requerido');
      const where = this.roleFilterService.apply(loggedUser, {
        id_family: familyId,
      });
      return await this.prisma.user.findMany({
        where,
        include: { rama: true, folder: true, family: true },
        orderBy: [{ family_role: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      console.log('Error al obtener usuarios por familia', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        'Error al obtener usuarios de la familia',
      );
    }
  }

  public async getFamilyAdmin(
    familyId: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    try {
      const { loggedUser } = await this.actionLogsService.resolveActor(
        reqOrActor ?? 'SYSTEM',
      );
      if (!loggedUser) throw new BadRequestException('Actor required');
      const where = this.roleFilterService.apply(loggedUser, {
        id_family: familyId,
        family_role: 'ADMIN',
      });
      const admin = await this.prisma.user.findFirst({
        where,
        include: { rama: true, folder: true, family: true },
      });
      if (!admin)
        throw new NotFoundException(
          'No se encontró un administrador para esta familia',
        );
      return admin;
    } catch (error) {
      console.log('Error al obtener administrador de familia', error);
    }
  }

  public async getFamilyAdmins(
    familyId: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    try {
      const { loggedUser } = await this.actionLogsService.resolveActor(
        reqOrActor ?? 'SYSTEM',
      );
      if (!loggedUser) throw new BadRequestException('Actor required');
      const where = this.roleFilterService.apply(loggedUser, {
        id_family: familyId,
        family_role: 'ADMIN',
      });
      return await this.prisma.user.findMany({
        where,
        include: { rama: true, folder: true, family: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.log('Error al obtener administradores de familia', error);
      throw new InternalServerErrorException(
        'Error al obtener administradores de familia',
      );
    }
  }

  public async promoteToFamilyAdmin(
    userId: string,
    familyId: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    if (!loggedUser) throw new BadRequestException('Actor required');
    const { log } = await this.actionLogsService.start(
      ActionType.USER_UPDATE,
      reqOrActor ?? 'SYSTEM',
      {
        target_table: ActionTargetTable.USER,
        target_id: userId,
        id_family: familyId,
      },
    );

    try {
      if (loggedUser.role === 'BENEFICIARIO') {
        throw new BadRequestException(
          'No tiene permisos para promover usuarios',
        );
      }

      if (!userId || !familyId) {
        throw new BadRequestException(
          'ID de usuario e ID de familia son requeridos',
        );
      }

      // Verificar que el usuario existe y pertenece a la familia
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          id_family: familyId,
        },
      });

      if (!user) {
        throw new NotFoundException(
          'Usuario no encontrado o no pertenece a esta familia',
        );
      }

      // Verificar que la familia existe
      const family = await this.prisma.family.findFirst({
        where: { id: familyId },
      });

      if (!family) {
        throw new NotFoundException('La familia especificada no existe');
      }

      // Promover usuario a administrador
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { family_role: 'ADMIN' },
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: updated.id,
        id_family: familyId,
        promoted: {
          id: updated.id,
          username: updated.username,
          name: updated.name,
        },
      });

      return updated;
    } catch (error) {
      console.log('Error al promover usuario a administrador', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al promover el usuario a administrador',
      );
    }
  }

  public async demoteFromFamilyAdmin(
    userId: string,
    familyId: string,
    reqOrActor?: ExpressRequest | 'SYSTEM',
  ) {
    const { loggedUser } = await this.actionLogsService.resolveActor(
      reqOrActor ?? 'SYSTEM',
    );
    if (!loggedUser) throw new BadRequestException('Actor required');
    const { log } = await this.actionLogsService.start(
      ActionType.USER_UPDATE,
      reqOrActor ?? 'SYSTEM',
      {
        target_table: ActionTargetTable.USER,
        target_id: userId,
        id_family: familyId,
      },
    );

    try {
      if (loggedUser.role === 'BENEFICIARIO') {
        throw new BadRequestException(
          'No tiene permisos para degradar usuarios',
        );
      }

      if (!userId || !familyId) {
        throw new BadRequestException(
          'ID de usuario e ID de familia son requeridos',
        );
      }

      // Verificar que el usuario existe y pertenece a la familia
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          id_family: familyId,
          family_role: 'ADMIN',
        },
      });

      if (!user) {
        throw new NotFoundException(
          'Usuario administrador no encontrado en esta familia',
        );
      }

      // Verificar que no es el último administrador
      const adminCount = await this.prisma.user.count({
        where: {
          id_family: familyId,
          family_role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'No se puede remover el último administrador de la familia',
        );
      }

      // Degradar usuario a miembro regular
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { family_role: 'MEMBER' },
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: updated.id,
        id_family: familyId,
        demoted: { id: updated.id, username: updated.username },
      });

      return updated;
    } catch (error) {
      console.log('Error al degradar usuario de administrador', error);
      await this.actionLogsService.markError(log.id, error as Error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al degradar el administrador a miembro',
      );
    }
  }

  // Necesario para uso en AuthService (sin restricciones de rol)
  public async getByIdInternal(id: string) {
    try {
      return this.prisma.user.findFirst({
        where: { id },
        include: { rama: true, folder: true, family: true },
      });
    } catch (error) {
      console.log('Error al obtener usuario por ID', error);
      throw new InternalServerErrorException('Error al obtener usuario por ID');
    }
  }

  public async findByInternal(where: Partial<User>) {
    try {
      return this.prisma.user.findFirst({
        where,
        include: { rama: true, folder: true, family: true },
      });
    } catch (error) {
      console.log('Error en la búsqueda de usuario', error);
      throw new InternalServerErrorException('Error en la búsqueda de usuario');
    }
  }
}

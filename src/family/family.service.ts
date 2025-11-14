import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
import { BalanceService } from 'src/balance/balance.service';
import { Family } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class FamilyService {
  constructor(
    private prisma: PrismaService,
    private balanceService: BalanceService,
    private actionLogsService: ActionLogsService,
    private authService: AuthService,
  ) {}
  // actor resolution centralized in ActionLogsService
  public async create(data: CreateFamilyDto, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Family> {
    // Start an action log and let ActionLogsService resolve the actor from the request (or accept 'SYSTEM')
    const { log } = await this.actionLogsService.start(
      ActionType.FAMILY_CREATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.FAMILY },
    );

    try {
      const newBalance = await this.balanceService.create({
        value: 0,
        cfa_balance_value: 0,
        custom_cuota: 0,
        custom_cfa_value: 0,
        is_custom_cuota: false,
        is_custom_cfa: false,
      }, reqOrActor);

      const balanceId = newBalance.id;

      const validateRama = await this.prisma.rama.findFirst({
        where: { id: data.manage_by },
      });
      if (!validateRama) {
        throw new BadRequestException(
          `La rama con ID ${data.manage_by} no existe`,
        );
      }
      // Crear la familia primero
      const family = await this.prisma.family.create({
        data: {
          id_balance: balanceId,
          manage_by: data.manage_by,
          name: data.name,
          phone: data.phone,
        },
      });

      // Si se proporciona datos del usuario administrador, crear el usuario
      if (data.admin_user) {
        await this.createFamilyAdminUser(family.id, data.admin_user);
      }

      // Retornar la familia con sus relaciones
      const familyWithRelations = await this.prisma.family.findUnique({
        where: { id: family.id },
        include: {
          users: true,
          balance: true,
        },
      });

      const created = familyWithRelations || family;

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: created.id,
        family: { id: created.id, name: created.name, phone: created.phone },
      });

      return created;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('Error al crear la familia: ', error);
      await this.actionLogsService.markError(log.id, error as Error);

      throw new InternalServerErrorException('Error al crear la familia');
    }
  }

  private async createFamilyAdminUser(familyId: string, adminUserData: any) {
    try {
      // Verificar si ya existe un usuario con el mismo username
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: { username: adminUserData.username.trim() },
      });

      if (existingUserByUsername) {
        throw new ConflictException(
          `Ya existe un usuario con el username: ${adminUserData.username}`,
        );
      }

      // Verificar si ya existe un usuario con el mismo email
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: { email: adminUserData.email.trim().toLowerCase() },
      });

      if (existingUserByEmail) {
        throw new ConflictException(
          `Ya existe un usuario con el email: ${adminUserData.email}`,
        );
      }

      // Verificar si ya existe un usuario con el mismo DNI
      const existingUserByDNI = await this.prisma.user.findFirst({
        where: { dni: adminUserData.dni.trim() },
      });

      if (existingUserByDNI) {
        throw new ConflictException(
          `Ya existe un usuario con el DNI: ${adminUserData.dni}`,
        );
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(
        adminUserData.password,
        +process.env.HASH_SALT || 10,
      );

      // Crear el usuario administrador de la familia (puede haber múltiples administradores)
      await this.prisma.user.create({
        data: {
          username: adminUserData.username.trim(),
          password: hashedPassword,
          name: adminUserData.name.trim(),
          last_name: adminUserData.last_name.trim(),
          address: adminUserData.address.trim(),
          phone: adminUserData.phone.trim(),
          email: adminUserData.email.trim().toLowerCase(),
          gender: adminUserData.gender,
          dni: adminUserData.dni.trim(),
          birthdate: adminUserData.birthdate,
          citizenship: adminUserData.citizenship.trim(),
          role: adminUserData.role || 'BENEFICIARIO', // Por defecto BENEFICIARIO
          family_role: 'ADMIN', // Siempre ADMIN para el usuario creado desde familia
          id_family: familyId,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error al crear el usuario administrador de la familia: ', error);
      throw new InternalServerErrorException(
        'Error al crear el usuario administrador de la familia',
      );
    }
  }

  public async getFamiliesByRama(id_rama: string) {
    try {
      if (!id_rama) {
        throw new BadRequestException('ID de rama es requerido');
      }
      return await this.prisma.family.findMany({
        where: { manage_by: id_rama },
        include: { users: true }, // necesario para mostrar a las familias con sus usuarios
      });  
    } catch (error) {
      console.error('Error al obtener las familias por rama: ', error);
      throw new InternalServerErrorException('Error al obtener las familias por rama');
    }
  }

  public async findAll(): Promise<Family[]> {
    try {
      return await this.prisma.family.findMany({
        include: {
          transactions: true,
          users: true,
          balance: true,
        },
      });
    } catch (error) {
      console.error('Error al obtener las familias: ', error);
      throw new InternalServerErrorException('Error al obtener las familias');
    }
  }

  public async findOne(id: string): Promise<Family> {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      const family = await this.prisma.family.findUnique({
        where: { id },
        include: {
          transactions: true,
          users: true,
          balance: true,
        },
      });

      if (!family) {
        throw new NotFoundException(`Familia con ID ${id} no encontrada`);
      }

      return family;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al obtener la familia: ', error);
      throw new InternalServerErrorException('Error al obtener la familia');
    }
  }

  public async update(id: string, data: UpdateFamilyDto, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Family> {
    const { log } = await this.actionLogsService.start(
      ActionType.FAMILY_UPDATE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.FAMILY, target_id: id },
    );
    const userActor = log.id_user ?? 'SYSTEM';

    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

  await this.findOne(id); // asegura que existe

      const updated = await this.prisma.family.update({ where: { id }, data });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        target_id: updated.id,
        family: { id: updated.id, name: updated.name, phone: updated.phone },
      });

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al actualizar la familia: ', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException('Error al actualizar la familia');
    }
  }

  public async remove(id: string, reqOrActor?: ExpressRequest | 'SYSTEM'): Promise<Family> {
    const { log } = await this.actionLogsService.start(
      ActionType.FAMILY_DELETE,
      reqOrActor ?? 'SYSTEM',
      { target_table: ActionTargetTable.FAMILY, target_id: id },
    );
    const userActor = log.id_user ?? 'SYSTEM';

    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      await this.findOne(id); // asegura que existe

      const deleted = await this.prisma.family.delete({ where: { id } });

      await this.actionLogsService.markSuccess(log.id, undefined, {
        deleted: { id: deleted.id, name: deleted.name },
      });

      return deleted;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.log('Error al eliminar la familia: ', error);
      await this.actionLogsService.markError(log.id, error as Error);
      throw new InternalServerErrorException('Error al eliminar la familia');
    }
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Family;
    value: string | number;
  }): Promise<Family | null> {
    try {
      return await this.prisma.family.findFirst({
        where: { [key]: value },
      });
    } catch (error) {
      console.log('Error en la búsqueda de familia: ', error);
      throw new InternalServerErrorException('Error en la búsqueda de familia');
    }
  }
}

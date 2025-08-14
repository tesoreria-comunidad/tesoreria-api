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

@Injectable()
export class FamilyService {
  constructor(
    private prisma: PrismaService,
    private balanceService: BalanceService,
  ) {}
  public async create(data: CreateFamilyDto): Promise<Family> {
    try {
      let balanceId = data.id_balance;

      if (!balanceId) {
        const newBalance = await this.balanceService.create({
          cuota_balance: 0,
          cfa_balance: 0,
          custom_balance: 0,
          is_custom_cuota: false,
          is_custom_cfa: false,
        });

        balanceId = newBalance.id;
      } else {
        const existingBalance = await this.balanceService.getById(balanceId);
        if (!existingBalance) {
          throw new BadRequestException('El balance proporcionado no existe');
        }
      }

      // Crear la familia primero
      const family = await this.prisma.family.create({
        data: {
          id_balance: balanceId,
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

      return familyWithRelations || family;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear la familia');
    }
  }

  private async createFamilyAdminUser(familyId: string, adminUserData: any) {
    try {
      // Verificar si ya existe un usuario con el mismo username
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: { username: adminUserData.username.trim() }
      });

      if (existingUserByUsername) {
        throw new ConflictException(`Ya existe un usuario con el username: ${adminUserData.username}`);
      }

      // Verificar si ya existe un usuario con el mismo email
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: { email: adminUserData.email.trim().toLowerCase() }
      });

      if (existingUserByEmail) {
        throw new ConflictException(`Ya existe un usuario con el email: ${adminUserData.email}`);
      }

      // Verificar si ya existe un usuario con el mismo DNI
      const existingUserByDNI = await this.prisma.user.findFirst({
        where: { dni: adminUserData.dni.trim() }
      });

      if (existingUserByDNI) {
        throw new ConflictException(`Ya existe un usuario con el DNI: ${adminUserData.dni}`);
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(
        adminUserData.password,
        +process.env.HASH_SALT || 10,
      );

      // Crear el usuario administrador de la familia
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
      throw new InternalServerErrorException('Error al crear el usuario administrador de la familia');
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
      throw new InternalServerErrorException('Error al obtener la familia');
    }
  }

  public async update(id: string, data: UpdateFamilyDto): Promise<Family> {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      await this.findOne(id); // asegura que existe

      return await this.prisma.family.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar la familia');
    }
  }

  public async remove(id: string): Promise<Family> {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      await this.findOne(id); // asegura que existe

      return await this.prisma.family.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
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
      throw new InternalServerErrorException('Error en la búsqueda de familia');
    }
  }
}

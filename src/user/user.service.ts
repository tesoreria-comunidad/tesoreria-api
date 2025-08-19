import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserDTO, CreateUserDTO } from './dto/user.dto';
import { removeUndefined } from 'src/utils/remove-undefined.util';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleFilterService } from 'src/services/RoleFilterService';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private roleFilterService: RoleFilterService,
  ) {}

  public async getAllUser(loggedUser: any) {
    try {
      const where = this.roleFilterService.apply(loggedUser);
      return await this.prisma.user.findMany({
        where,
        include: {
          folder: true,
          rama: true,
          family: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los usuarios');
    }
  }

  public async getById(id: string, loggedUser: any) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const where = this.roleFilterService.apply(loggedUser, { id });
      const user = await this.prisma.user.findFirst({
        where,
        include: { rama: true, folder: true, family: true },
      });
      if (!user)
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      return user;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Error al obtener el usuario');
    }
  }

  public async create(data: CreateUserDTO) {
    try {
      // Verificar si ya existe un usuario con el mismo username
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: { username: data.username.trim() },
      });

      if (existingUserByUsername) {
        throw new ConflictException(
          'Ya existe un usuario con ese nombre de usuario',
        );
      }

      // Verificar si ya existe un usuario con el mismo email
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: { email: data.email.trim().toLowerCase() },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }

      // Verificar si ya existe un usuario con el mismo DNI
      const existingUserByDNI = await this.prisma.user.findFirst({
        where: { dni: data.dni.trim() },
      });

      if (existingUserByDNI) {
        throw new ConflictException('Ya existe un usuario con ese DNI');
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
        username: data.username.trim(),
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        dni: data.dni.trim(),
        citizenship: data.citizenship.trim(),
        password: hashedPassword,
        birthdate: data.birthdate,
        gender: data.gender,
        role: data.role,
        family_role: data.family_role || 'MEMBER', // Por defecto MEMBER si no se especifica
        id_folder: data.id_folder,
        id_rama: data.id_rama,
        id_family: data.id_family,
      };

      return await this.prisma.user.create({
        data: cleanData,
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });
    } catch (error) {
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
    loggedUser: any,
  ) {
    try {
      const where = this.roleFilterService.apply(loggedUser, { [key]: value });
      return await this.prisma.user.findFirst({
        where,
        include: { rama: true, folder: true, family: true },
      });
    } catch {
      throw new InternalServerErrorException('Error en la búsqueda de usuario');
    }
  }

  public async update(id: string, data: UpdateUserDTO, loggedUser: any) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');

      // Verificar que el usuario existe
      await this.getById(id, loggedUser);

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

      // Verificar que la rama existe si se proporciona
      if (data.id_rama) {
        const ramaExists = await this.prisma.rama.findFirst({
          where: { id: data.id_rama },
        });
        if (!ramaExists)
          throw new BadRequestException('La rama especificada no existe');
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

      return await this.prisma.user.update({
        where: { id },
        data: cleanData,
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });
    } catch (error) {
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

  public async delete(id: string, loggedUser: any) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      await this.getById(id, loggedUser);
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Error al eliminar el usuario');
    }
  }

  public async bulkCreate(
    users: CreateUserDTO[],
    id_rama: string,
    loggedUser: any,
  ) {
    try {
      // Si no es MASTER o DIRIGENTE, se bloquea la creacion
      if (loggedUser.role === 'BENEFICIARIO') {
        throw new BadRequestException('No tiene permisos para creación masiva');
      }

      // Si es DIRIGENTE, forzar id_rama a la suya
      if (loggedUser.role === 'DIRIGENTE') {
        id_rama = loggedUser.id_rama;
      }

      if (!Array.isArray(users) || users.length === 0) {
        throw new BadRequestException(
          'Debe proporcionar una lista de usuarios',
        );
      }

      // Validación de usernames existentes
      const usernames = users.map((u) => u.username);
      const existingUsernames = await this.prisma.user.findMany({
        where: { username: { in: usernames } },
        select: { username: true },
      });

      if (existingUsernames.length > 0) {
        const conflicts = existingUsernames.map((u) => u.username);
        throw new ConflictException(
          `Ya existen usuarios con los siguientes usernames: ${conflicts.join(', ')}`,
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

      // Hashear contraseñas y limpiar datos
      const usersWithHashedPasswords = await Promise.all(
        users.map(async (user) => ({
          ...user,
          username: user.username.trim(),
          name: user.name.trim(),
          last_name: user.last_name.trim(),
          address: user.address.trim(),
          phone: user.phone.trim(),
          email: user.email.trim().toLowerCase(),
          dni: user.dni.trim(),
          citizenship: user.citizenship.trim(),
          password: await bcrypt.hash(
            user.password,
            +process.env.HASH_SALT || 10,
          ),
          id_rama: id_rama || user.id_rama || null,
        })),
      );

      return await this.prisma.user.createMany({
        data: usersWithHashedPasswords,
        skipDuplicates: true,
      });
    } catch (error) {
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

  public async getUsersByFamily(familyId: string, loggedUser: any) {
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

  public async getFamilyAdmin(familyId: string, loggedUser: any) {
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
  }

  public async getFamilyAdmins(familyId: string, loggedUser: any) {
    const where = this.roleFilterService.apply(loggedUser, {
      id_family: familyId,
      family_role: 'ADMIN',
    });
    return await this.prisma.user.findMany({
      where,
      include: { rama: true, folder: true, family: true },
      orderBy: { name: 'asc' },
    });
  }

  public async promoteToFamilyAdmin(
    userId: string,
    familyId: string,
    loggedUser: any,
  ) {
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
      return await this.prisma.user.update({
        where: { id: userId },
        data: { family_role: 'ADMIN' },
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });
    } catch (error) {
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
    loggedUser: any,
  ) {
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
      return await this.prisma.user.update({
        where: { id: userId },
        data: { family_role: 'MEMBER' },
        include: {
          rama: true,
          folder: true,
          family: true,
        },
      });
    } catch (error) {
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
    return this.prisma.user.findFirst({
      where: { id },
      include: { rama: true, folder: true, family: true },
    });
  }

  public async findByInternal(where: Partial<User>) {
    return this.prisma.user.findFirst({
      where,
      include: { rama: true, folder: true, family: true },
    });
  }
}

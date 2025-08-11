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
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  public async getAllUser() {
    try {
      return await this.prisma.user.findMany({
        include: {
          folder: true,
          rama: true,
          family: true
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los usuarios');
    }
  }

  public async getById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      const user = await this.prisma.user.findFirst({
        where: { id },
        include: { 
          rama: true,
          folder: true,
          family: true 
        },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return user;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el usuario');
    }
  }

  public async create(data: CreateUserDTO) {
    try {
      // Verificar si ya existe un usuario con el mismo username
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: { username: data.username.trim() }
      });

      if (existingUserByUsername) {
        throw new ConflictException('Ya existe un usuario con ese nombre de usuario');
      }

      // Verificar si ya existe un usuario con el mismo email
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: { email: data.email.trim().toLowerCase() }
      });

      if (existingUserByEmail) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }

      // Verificar si ya existe un usuario con el mismo DNI
      const existingUserByDNI = await this.prisma.user.findFirst({
        where: { dni: data.dni.trim() }
      });

      if (existingUserByDNI) {
        throw new ConflictException('Ya existe un usuario con ese DNI');
      }

      // Verificar que la rama existe si se proporciona
      if (data.id_rama) {
        const ramaExists = await this.prisma.rama.findFirst({
          where: { id: data.id_rama }
        });
        if (!ramaExists) {
          throw new BadRequestException('La rama especificada no existe');
        }
      }

      // Verificar que la carpeta existe si se proporciona
      if (data.id_folder) {
        const folderExists = await this.prisma.folder.findFirst({
          where: { id: data.id_folder }
        });
        if (!folderExists) {
          throw new BadRequestException('La carpeta especificada no existe');
        }
      }

      // Verificar que la familia existe si se proporciona
      if (data.id_family) {
        const familyExists = await this.prisma.family.findFirst({
          where: { id: data.id_family }
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

      /* // Preparar datos limpios para la creación
      const cleanData = {
        ...data,
        username: data.username.trim(),
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        dni: data.dni.trim(),
        citizenship: data.citizenship.trim(),
        password: hashedPassword
      }; */

      return await this.prisma.user.create({ 
        data: data,
        include: {
          rama: true,
          folder: true,
          family: true
        }
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

  public async findBy({
    key,
    value,
  }: {
    key: keyof User;
    value: string | number;
  }) {
    try {
      return await this.prisma.user.findFirst({ 
        where: { [key]: value },
        include: {
          rama: true,
          folder: true,
          family: true
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error en la búsqueda de usuario');
    }
  }

  public async update(id: string, data: UpdateUserDTO) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que el usuario existe
      await this.getById(id);

      // Si se actualiza username, verificar que no exista otro usuario con el mismo
      if (data.username) {
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            username: data.username.trim(),
            NOT: { id: id }
          }
        });
        if (existingUser) {
          throw new ConflictException('Ya existe otro usuario con ese nombre de usuario');
        }
      }

      // Si se actualiza email, verificar que no exista otro usuario con el mismo
      if (data.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: data.email.trim().toLowerCase(),
            NOT: { id: id }
          }
        });
        if (existingUser) {
          throw new ConflictException('Ya existe otro usuario con ese email');
        }
      }

      // Si se actualiza DNI, verificar que no exista otro usuario con el mismo
      if (data.dni) {
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            dni: data.dni.trim(),
            NOT: { id: id }
          }
        });
        if (existingUser) {
          throw new ConflictException('Ya existe otro usuario con ese DNI');
        }
      }

      // Verificar que la rama existe si se proporciona
      if (data.id_rama) {
        const ramaExists = await this.prisma.rama.findFirst({
          where: { id: data.id_rama }
        });
        if (!ramaExists) {
          throw new BadRequestException('La rama especificada no existe');
        }
      }

      // Verificar que la carpeta existe si se proporciona
      if (data.id_folder) {
        const folderExists = await this.prisma.folder.findFirst({
          where: { id: data.id_folder }
        });
        if (!folderExists) {
          throw new BadRequestException('La carpeta especificada no existe');
        }
      }

      // Verificar que la familia existe si se proporciona
      if (data.id_family) {
        const familyExists = await this.prisma.family.findFirst({
          where: { id: data.id_family }
        });
        if (!familyExists) {
          throw new BadRequestException('La familia especificada no existe');
        }
      }

      const cleanData = removeUndefined(data);

      // Limpiar strings si existen
      if (cleanData.username) cleanData.username = cleanData.username.trim();
      if (cleanData.name) cleanData.name = cleanData.name.trim();
      if (cleanData.last_name) cleanData.last_name = cleanData.last_name.trim();
      if (cleanData.address) cleanData.address = cleanData.address.trim();
      if (cleanData.phone) cleanData.phone = cleanData.phone.trim();
      if (cleanData.email) cleanData.email = cleanData.email.trim().toLowerCase();
      if (cleanData.dni) cleanData.dni = cleanData.dni.trim();
      if (cleanData.citizenship) cleanData.citizenship = cleanData.citizenship.trim();

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
          family: true
        }
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

  public async delete(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID es requerido');
      }

      // Verificar que el usuario existe
      await this.getById(id);

      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el usuario');
    }
  }

  public async bulkCreate(users: CreateUserDTO[], id_rama?: string) {
    try {
      if (!Array.isArray(users) || users.length === 0) {
        throw new BadRequestException('Debe proporcionar una lista de usuarios');
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
          where: { id: id_rama }
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
}

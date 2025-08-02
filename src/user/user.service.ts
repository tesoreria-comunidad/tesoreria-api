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
    return this.prisma.user.findMany({
      include: {
        folder: true,
        rama: true,
      },
    });
  }

  public async getById(id: string) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const user = await this.prisma.user.findFirst({
        where: { id },
        include: { rama: true },
      });
      if (!user)
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      return user;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener un usuario');
    }
  }

  public async create(data: CreateUserDTO | User) {
    try {
      // Validaciones de campos obligatorios
      if (!data.username || data.username.trim().length === 0) {
        throw new BadRequestException('El nombre de usuario es requerido');
      }
      if (!data.password || data.password.trim().length === 0) {
        throw new BadRequestException('La contraseña es requerida');
      }
      if (!data.name || data.name.trim().length === 0) {
        throw new BadRequestException('El nombre es requerido');
      }
      if (!data.last_name || data.last_name.trim().length === 0) {
        throw new BadRequestException('El apellido es requerido');
      }
      if (!data.address || data.address.trim().length === 0) {
        throw new BadRequestException('La dirección es requerida');
      }
      if (!data.phone || data.phone.trim().length === 0) {
        throw new BadRequestException('El teléfono es requerido');
      }
      if (!data.email || data.email.trim().length === 0) {
        throw new BadRequestException('El email es requerido');
      }
      if (!data.dni || data.dni.trim().length === 0) {
        throw new BadRequestException('El DNI es requerido');
      }
      if (!data.birthdate || isNaN(new Date(data.birthdate).getTime())) {
        throw new BadRequestException('La fecha de nacimiento es requerida y debe ser válida');
      }
      if (!data.citizenship || data.citizenship.trim().length === 0) {
        throw new BadRequestException('La ciudadanía es requerida');
      }
      if (!data.role) {
        throw new BadRequestException('El rol es requerido');
      }
      if (!data.gender) {
        throw new BadRequestException('El género es requerido');
      }

      // Verificar si ya existe un usuario con el mismo username
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: { username: data.username.trim() }
      });

      if (existingUserByUsername) {
        throw new BadRequestException('Ya existe un usuario con ese nombre de usuario');
      }

      // Verificar si ya existe un usuario con el mismo email
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: { email: data.email.trim().toLowerCase() }
      });

      if (existingUserByEmail) {
        throw new BadRequestException('Ya existe un usuario con ese email');
      }

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
      if (error instanceof BadRequestException) {
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
    return this.prisma.user.findFirst({ where: { [key]: value } });
  }

  public async update(id: string, data: UpdateUserDTO) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const cleanData = removeUndefined(data); // helper para eliminar campos undefined
      await this.getById(id);
      return await this.prisma.user.update({
        where: { id },
        data: cleanData,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar un usuario');
    }
  }

  public async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  public async bulkCreate(users: CreateUserDTO[], id_rama?: string) {
    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestException('Debe proporcionar una lista de usuarios');
    }

    /* Validación de usernames existentes */
    const usernames = users.map((u) => u.username);

    const existingUsernames = await this.prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { username: true },
    });

    if (existingUsernames.length > 0) {
      const conflicts = existingUsernames.map((u) => u.username);
      throw new BadRequestException(
        `Ya existen usuarios con los siguientes usernames: ${conflicts.join(', ')}`,
      );
    }

    /*Validación de emails existentes */
    const emails = users.map((u) => u.email?.toLowerCase()).filter(Boolean);

    if (emails.length > 0) {
      const existingEmails = await this.prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      });

      if (existingEmails.length > 0) {
        const conflicts = existingEmails.map((u) => u.email);
        throw new BadRequestException(
          `Ya existen usuarios con los siguientes emails: ${conflicts.join(', ')}`,
        );
      }
    }

    /* Hashear contraseñas y setear id_rama si aplica */
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(
          user.password,
          +process.env.HASH_SALT || 10,
        ),
        id_rama: id_rama ?? null,
        email: user.email?.toLowerCase() ?? null,
      })),
    );

    try {
      return await this.prisma.user.createMany({
        data: usersWithHashedPasswords,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error bulkCreate users:', error);
      throw new InternalServerErrorException('Error al crear usuarios en lote');
    }
  }
}

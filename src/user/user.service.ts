import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserDTO, CreateUserDTO } from './dto/user.dto';
import { removeUndefined } from 'src/utils/remove-undefined.util';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  public async getAllUser() {
    return this.prisma.user.findMany({
      include: {
        person: true,
        folder: true,
        rama: true,
      },
    });
  }

  public async getById(id: string) {
    try {
      if (!id) throw new BadRequestException('ID es requerido');
      const user = await this.prisma.user.findFirst({ where: { id } });
      if (!user)
        throw new NotFoundException(`Usuaro con ID ${id} no encontrado`);
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
    return this.prisma.user.create({ data });
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

  public async bulkCreate(users: CreateUserDTO[]) {
    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestException('Debe proporcionar una lista de usuarios');
    }

    // Obtener los usernames de los usuarios a crear
    const usernames = users.map((u) => u.username);

    // Buscar si ya existen usuarios con esos usernames
    const existingUsers = await this.prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { username: true },
    });

    if (existingUsers.length > 0) {
      const existingUsernames = existingUsers.map((u) => u.username);
      throw new BadRequestException(
        `Ya existen usuarios con los siguientes usernames: ${existingUsernames.join(', ')}`,
      );
    }

    try {
      return await this.prisma.user.createMany({
        data: users,
        skipDuplicates: true,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error al crear usuarios en lote');
    }
  }
}

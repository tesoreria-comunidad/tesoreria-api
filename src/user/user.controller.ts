import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO, CreateUserDTO } from './dto/user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return await this.userService.getAllUser();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.getById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    return await this.userService.create(body as any);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDTO) {
    return await this.userService.update(id, body);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    try {
      const existingUser = await this.userService.getById(id);
      if (!existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return await this.userService.delete(id);
    } catch (error) {
      throw error;
    }
  }

  @Post('bulk')
  async bulkCreateUsers(
    @Body() body: { users: CreateUserDTO[] },
    @Query() query: { id_rama?: string },
  ) {
    const { users } = body;
    const { id_rama } = query;

    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestException('Debe proporcionar una lista de usuarios');
    }

    /** 🔹 Validar usernames duplicados en el payload */
    const usernames = users.map((user) => user.username);
    const duplicateUsernames = usernames.filter(
      (username, index) => usernames.indexOf(username) !== index,
    );
    if (duplicateUsernames.length > 0) {
      throw new BadRequestException(
        `Usuarios duplicados en el body con username: ${[...new Set(duplicateUsernames)].join(', ')}`,
      );
    }

    /** 🔹 Validar emails duplicados en el payload */
    const emails = users
      .map((user) => user.email?.toLowerCase())
      .filter(Boolean);
    const duplicateEmails = emails.filter(
      (email, index) => emails.indexOf(email) !== index,
    );
    if (duplicateEmails.length > 0) {
      throw new BadRequestException(
        `Usuarios duplicados en el body con email: ${[...new Set(duplicateEmails)].join(', ')}`,
      );
    }

    /** 🔹 Validar DNIs duplicados en el payload */
    const dniSet = new Set<string>();
    for (const user of users) {
      if (dniSet.has(user.dni)) {
        throw new BadRequestException(
          `DNI duplicado encontrado en el body: ${user.dni}`,
        );
      }
      dniSet.add(user.dni);
    }

    return await this.userService.bulkCreate(users, id_rama);
  }
}

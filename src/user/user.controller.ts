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
  HttpCode,
  HttpStatus,
  Request,

} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO, CreateUserDTO } from './dto/user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('MASTER', 'DIRIGENTE')

  async getAllUsers(@Request() req: any) {
    return await this.userService.getAllUser(req.user);

  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.getById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    return await this.userService.create(body);
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
    @Query() query: { id_rama: string },
    @Request() req: any,
  ) {
    const { users } = body;
    const { id_rama } = query;

    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestException('Debe proporcionar una lista de usuarios');
    }

    /** Validar usernames duplicados en el payload */
    const usernames = users.map((user) => user.username);
    const duplicateUsernames = usernames.filter(
      (username, index) => usernames.indexOf(username) !== index,
    );
    if (duplicateUsernames.length > 0) {
      throw new BadRequestException(
        `Usuarios duplicados en el body con username: ${[...new Set(duplicateUsernames)].join(', ')}`,
      );
    }

    /** Validar emails duplicados en el payload */
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

    /** Validar DNIs duplicados en el payload */
    const dniSet = new Set<string>();
    for (const user of users) {
      if (dniSet.has(user.dni)) {
        throw new BadRequestException(
          `DNI duplicado encontrado en el body: ${user.dni}`,
        );
      }
      dniSet.add(user.dni);
    }

    return await this.userService.bulkCreate(users, id_rama, req.user);
  }

  @Get('family/:familyId')
  @HttpCode(HttpStatus.OK)
  async getUsersByFamily(@Param('familyId') familyId: string, @Request() req: any) {
    return await this.userService.getUsersByFamily(familyId, req.user);
  }

  @Get('family/:familyId/admin')
  @HttpCode(HttpStatus.OK)
  async getFamilyAdmin(@Param('familyId') familyId: string, @Request() req: any) {
    return await this.userService.getFamilyAdmin(familyId, req.user);
  }

  @Get('family/:familyId/admins')
  @HttpCode(HttpStatus.OK)
  async getFamilyAdmins(@Param('familyId') familyId: string, @Request() req: any) {
    return await this.userService.getFamilyAdmins(familyId, req.user);
  }

  @Patch('family/:familyId/promote/:userId')
  @HttpCode(HttpStatus.OK)
  async promoteToFamilyAdmin(
    @Param('familyId') familyId: string,
    @Param('userId') userId: string,
    @Request() req: any
  ) {
    return await this.userService.promoteToFamilyAdmin(userId, familyId, req.user);
  }

  @Patch('family/:familyId/demote/:userId')
  @HttpCode(HttpStatus.OK)
  async demoteFromFamilyAdmin(
    @Param('familyId') familyId: string,
    @Param('userId') userId: string,
    @Request() req: any
  ) {
    return await this.userService.demoteFromFamilyAdmin(userId, familyId, req.user);
  }
}

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
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import {
  UpdateUserDTO,
  CreateUserDTO,
  BulkCreateUserDTO,
  BulkUpdateRamaDTO,
  UpdateUserRamaDTO,
} from './dto/user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('MASTER', 'DIRIGENTE')
  async getAllUsers(@Req() req: ExpressRequest) {
    return await this.userService.getAllUser(req);
  }

  @Get('/by-rama/:id_rama')
  async getUsersbyRama(@Param('id_rama') id_rama: string) {
    return await this.userService.getUsersByRama(id_rama);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  async getUserById(@Param('id') id: string, @Req() req: ExpressRequest) {
    return await this.userService.getById(id, req);
  }

  @Post()
  @Roles('MASTER', 'DIRIGENTE')
  async createUser(@Body() body: CreateUserDTO, @Req() req: ExpressRequest) {
    return await this.userService.create(body, req);
  }

  @Patch('bulk-rama')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reasignación masiva de rama',
    description:
      'Mueve uno o varios usuarios a una rama destino de forma atómica. ' +
      'MASTER puede mover usuarios de cualquier rama. ' +
      'DIRIGENTE solo puede mover usuarios que pertenezcan a su propia rama.',
  })
  @ApiBody({ type: BulkUpdateRamaDTO })
  @ApiResponse({
    status: 200,
    description: 'Usuarios reasignados correctamente',
    schema: {
      example: {
        updated_count: 3,
        users: [
          { id: 'uuid-1', name: 'Juan', last_name: 'Pérez', id_rama: 'uuid-rama' },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Payload inválido o array vacío' })
  @ApiResponse({
    status: 403,
    description: 'DIRIGENTE intentando mover usuarios de otra rama',
  })
  @ApiResponse({
    status: 404,
    description: 'Rama destino o uno/varios usuarios no encontrados',
  })
  @ApiResponse({ status: 500, description: 'Error interno — transacción revertida' })
  async bulkUpdateRama(
    @Body() body: BulkUpdateRamaDTO,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.bulkUpdateRama(body, req);
  }

  @Patch(':id/rama')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Traspaso de rama de un beneficiario',
    description:
      'Mueve a un beneficiario a la rama inmediatamente anterior o siguiente dentro del mismo grupo scout. ' +
      'MASTER puede traspasar cualquier beneficiario. ' +
      'DIRIGENTE solo puede traspasar beneficiarios de su propia rama. ' +
      'La operación registra historial en UserRamaHistory y un ActionLog.',
  })
  @ApiBody({ type: UpdateUserRamaDTO })
  @ApiResponse({ status: 200, description: 'Traspaso exitoso — retorna el usuario actualizado con la nueva rama' })
  @ApiResponse({ status: 400, description: 'Rama destino no es contigua, o no pertenece al mismo grupo' })
  @ApiResponse({ status: 401, description: 'JWT inválido o ausente' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos o DIRIGENTE intentando traspasar desde otra rama' })
  @ApiResponse({ status: 404, description: 'Usuario o rama no encontrada' })
  async transferRama(
    @Param('id') id: string,
    @Body() body: UpdateUserRamaDTO,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.transferRama(id, body, req);
  }

  @Get(':id/rama/historial')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de movimientos de rama de un beneficiario',
    description:
      'Devuelve todos los registros de UserRamaHistory del usuario, ordenados por fecha_ingreso descendente. ' +
      'MASTER puede ver cualquier historial. DIRIGENTE solo puede ver historial de su propia rama.',
  })
  @ApiResponse({ status: 200, description: 'Lista de registros de historial de rama' })
  @ApiResponse({ status: 401, description: 'JWT inválido o ausente' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos o DIRIGENTE intentando ver historial de otra rama' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getRamaHistorial(
    @Param('id') id: string,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.getRamaHistory(id, req);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDTO,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.update(id, body, req);
  }

  @Delete(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminación permanente de un usuario',
    description:
      'Borra de forma definitiva (hard delete) el registro de un usuario. ' +
      'MASTER puede eliminar cualquier usuario. ' +
      'DIRIGENTE solo puede eliminar usuarios de su propia rama. ' +
      'No se puede eliminar al único administrador de una familia ni al propio actor.',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
  @ApiResponse({ status: 400, description: 'El actor intenta borrarse a sí mismo' })
  @ApiResponse({
    status: 403,
    description: 'Rol sin permisos o DIRIGENTE intentando borrar usuario de otra rama',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario es el único administrador de su familia',
  })
  async deleteUser(@Param('id') id: string, @Req() req: ExpressRequest) {
    return await this.userService.delete(id, req);
  }

  @Post('bulk')
  @Roles('MASTER', 'DIRIGENTE')
  async bulkCreateUsers(
    @Body() body: { users: BulkCreateUserDTO[] },
    @Query() query: { id_rama: string },
    @Req() req: ExpressRequest,
  ) {
    const { users } = body;
    const { id_rama } = query;

    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestException('Debe proporcionar una lista de usuarios');
    }

    /** Validar usernames duplicados en el payload */

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
      if (user.dni) {
        if (dniSet.has(user.dni)) {
          throw new BadRequestException(
            `DNI duplicado encontrado en el body: ${user.dni}`,
          );
        }
        dniSet.add(user.dni);
      }
    }

    return await this.userService.bulkCreate(users, id_rama, req);
  }
  @Roles('MASTER', 'DIRIGENTE')
  @Get('family/:familyId')
  @HttpCode(HttpStatus.OK)
  async getUsersByFamily(
    @Param('familyId') familyId: string,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.getUsersByFamily(familyId, req);
  }

  @Roles('MASTER', 'DIRIGENTE')
  @Get('family/:familyId/admin')
  @HttpCode(HttpStatus.OK)
  async getFamilyAdmin(
    @Param('familyId') familyId: string,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.getFamilyAdmin(familyId, req);
  }

  @Roles('MASTER', 'DIRIGENTE')
  @Get('family/:familyId/admins')
  @HttpCode(HttpStatus.OK)
  async getFamilyAdmins(
    @Param('familyId') familyId: string,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.getFamilyAdmins(familyId, req);
  }

  @Roles('MASTER', 'DIRIGENTE')
  @Patch('family/:familyId/promote/:userId')
  @HttpCode(HttpStatus.OK)
  async promoteToFamilyAdmin(
    @Param('familyId') familyId: string,
    @Param('userId') userId: string,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.promoteToFamilyAdmin(userId, familyId, req);
  }

  @Roles('MASTER', 'DIRIGENTE')
  @Patch('family/:familyId/demote/:userId')
  @HttpCode(HttpStatus.OK)
  async demoteFromFamilyAdmin(
    @Param('familyId') familyId: string,
    @Param('userId') userId: string,
    @Req() req: ExpressRequest,
  ) {
    return await this.userService.demoteFromFamilyAdmin(userId, familyId, req);
  }
}

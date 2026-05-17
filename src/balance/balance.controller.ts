import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { BalanceService } from './balance.service';
import { CreateBalanceDTO, UpdateBalanceDTO, GetBalanceHistoryQueryDTO } from './dto/balance.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

// using Nest's @Request() typing (any) for controller handlers
@ApiTags('balance')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getAllBalances(@Req() req: ExpressRequest) {
    return await this.balanceService.getAllBalances(req);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  @HttpCode(HttpStatus.OK)
  async getBalanceById(@Param('id') id: string, @Req() req: ExpressRequest) {
    return await this.balanceService.getById(id, req);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateBalanceDTO, @Req() req: ExpressRequest) {
    return await this.balanceService.create(body, req);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBalanceDTO,
  @Req() req: ExpressRequest,
  ) {
    return await this.balanceService.update(id, body, req);
  }
  @Post('/reset-all')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async ResetAll(@Req() req: ExpressRequest) {
    return await this.balanceService.resetAll(req);
  }
  @Post('/update-family/:id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async updateFamilyBalance(@Param('id') id: string) {
    return await this.balanceService.updateBalanceForFamily(id);
  }
  @Post('/update-all')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async UpdateAll(@Req() req: ExpressRequest) {
    return await this.balanceService.updateAll(req);
  }

  @Get(':id/history')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener historial de cambios de un balance' })
  @ApiParam({ name: 'id', description: 'ID del balance', type: String })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo de cambio (CUOTA_PAYMENT | MONTHLY_ADJUSTMENT | MANUAL_ADJUSTMENT)' })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio ISO (inclusive)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin ISO (inclusive)' })
  @ApiQuery({ name: 'take', required: false, description: 'Cantidad de registros a traer (default 50)' })
  @ApiQuery({ name: 'skip', required: false, description: 'Registros a omitir para paginación (default 0)' })
  @ApiResponse({ status: 200, description: 'Historial de balance obtenido correctamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos para acceder al historial de esta familia' })
  @ApiResponse({ status: 404, description: 'Balance no encontrado' })
  async getHistory(
    @Param('id') id: string,
    @Query() query: GetBalanceHistoryQueryDTO,
    @Req() req: ExpressRequest,
  ) {
    return await this.balanceService.getHistoryByBalanceId(id, query, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: ExpressRequest) {
    await this.balanceService.delete(id, req);
    return;
  }
}

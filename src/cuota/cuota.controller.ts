import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Request as ExpressRequest } from 'express';

@UseGuards(AuthGuard, RolesGuard)
@Controller('cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCuotas(@Req() req: ExpressRequest) {
    return await this.cuotaService.getAllCuota(req);
  }

  @Get(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async getCuotaById(@Param('id') id: string, @Req() req: ExpressRequest) {
    return await this.cuotaService.getById(id, req);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCuotaDTO, @Req() req: ExpressRequest) {
    return await this.cuotaService.create(body, req);
  }

  @Patch(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateCuotaDTO, @Req() req: ExpressRequest) {
    return await this.cuotaService.update(id, body, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: ExpressRequest) {
    await this.cuotaService.delete(id, req);
    return;
  }
}

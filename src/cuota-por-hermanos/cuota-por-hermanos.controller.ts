import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CuotaPorHermanosService } from './cuota-por-hermanos.service';
import { CreateCuotaPorHermanosDto, UpdateCuotaPorHermanosDto } from './dto/cuota-por-hermanos.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('cuota-por-hermanos')
export class CuotaPorHermanosController {
  constructor(private readonly service: CuotaPorHermanosService) {}

  @Post()
  @Roles('MASTER', 'DIRIGENTE')
  create(@Body() dto: CreateCuotaPorHermanosDto, @Req() req: ExpressRequest) {
    return this.service.create(dto, req);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  update(@Param('id') id: string, @Body() dto: UpdateCuotaPorHermanosDto, @Req() req: ExpressRequest) {
    return this.service.update(id, dto, req);
  }

  @Delete(':id')
  @Roles('MASTER', 'DIRIGENTE')
  remove(@Param('id') id: string, @Req() req: ExpressRequest) {
    return this.service.remove(id, req);
  }
}
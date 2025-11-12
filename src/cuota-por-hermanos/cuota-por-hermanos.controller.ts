import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CuotaPorHermanosService } from './cuota-por-hermanos.service';
import { CreateCuotaPorHermanosDto, UpdateCuotaPorHermanosDto } from './dto/cuota-por-hermanos.dto';

@Controller('cuota-por-hermanos')
export class CuotaPorHermanosController {
  constructor(private readonly service: CuotaPorHermanosService) {}

  @Post()
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
  update(@Param('id') id: string, @Body() dto: UpdateCuotaPorHermanosDto, @Req() req: ExpressRequest) {
    return this.service.update(id, dto, req);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: ExpressRequest) {
    return this.service.remove(id, req);
  }
}
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CuotaPorHermanosService } from './cuota-por-hermanos.service';
import { CreateCuotaPorHermanosDto, UpdateCuotaPorHermanosDto } from './dto/cuota-por-hermanos.dto';

@Controller('cuota-por-hermanos')
export class CuotaPorHermanosController {
  constructor(private readonly service: CuotaPorHermanosService) {}

  @Post()
  create(@Body() dto: CreateCuotaPorHermanosDto) {
    return this.service.create(dto);
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
  update(@Param('id') id: string, @Body() dto: UpdateCuotaPorHermanosDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
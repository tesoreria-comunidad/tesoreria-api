import { Controller, Get, Post, Patch, Delete, Param, Body, Request } from '@nestjs/common';
import { CuotaPorHermanosService } from './cuota-por-hermanos.service';
import { CreateCuotaPorHermanosDto, UpdateCuotaPorHermanosDto } from './dto/cuota-por-hermanos.dto';

@Controller('cuota-por-hermanos')
export class CuotaPorHermanosController {
  constructor(private readonly service: CuotaPorHermanosService) {}

  @Post()
  create(@Body() dto: CreateCuotaPorHermanosDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
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
  update(@Param('id') id: string, @Body() dto: UpdateCuotaPorHermanosDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
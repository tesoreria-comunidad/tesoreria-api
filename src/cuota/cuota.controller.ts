import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCuotas() {
    return await this.cuotaService.getAllCuota();
  }

  @Get(':id')
  @Roles('master')
  @HttpCode(HttpStatus.OK)
  async getCuotaById(@Param('id') id: string) {
    return await this.cuotaService.getById(id);
  }

  @Post()
  @Roles('master')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCuotaDTO) {
    return await this.cuotaService.create(body);
  }

  @Patch(':id')
  @Roles('master')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateCuotaDTO) {
    return await this.cuotaService.update(id, body);
  }

  @Delete(':id')
  @Roles('master')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.cuotaService.delete(id);
    return;
  }
}

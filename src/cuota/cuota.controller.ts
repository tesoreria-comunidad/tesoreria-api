import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) {}

  @Get()
  async getAllCuotas() {
    return await this.cuotaService.getAllCuota();
  }

  @Get(':id')
  async getCuotaById(@Param('id') id: string) {
    return await this.cuotaService.getById(id);
  }

  @Post()
  async create(@Body() body: CreateCuotaDTO) {
    try {
      return await this.cuotaService.create(body);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCuotaDTO) {
    try {
      return await this.cuotaService.update(id, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.cuotaService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}

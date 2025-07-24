import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CreateCuotaDTO, UpdateCuotaDTO } from './dto/cuota.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCuotas() {
    return await this.cuotaService.getAllCuota();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCuotaById(@Param('id') id: string) {
    return await this.cuotaService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCuotaDTO) {
    return await this.cuotaService.create(body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateCuotaDTO) {
    return await this.cuotaService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.cuotaService.delete(id);
    return;
  }
}

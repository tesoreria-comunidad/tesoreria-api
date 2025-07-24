import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RamaService } from './rama.service';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('rama')
export class RamaController {
  constructor(private readonly ramaService: RamaService) {}

  @Get()
  async getAllRamas() {
    return await this.ramaService.getAllRama();
  }

  @Get(':id')
  async getRamaById(@Param('id') id: string) {
    return await this.ramaService.getById(id);
  }

  @Post()
  async create(@Body() body: CreateRamaDTO) {
    try {
      return await this.ramaService.create(body);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateRamaDTO) {
    try {
      return await this.ramaService.update(id, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.ramaService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}

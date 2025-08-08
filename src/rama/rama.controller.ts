import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RamaService } from './rama.service';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('rama')
export class RamaController {
  constructor(private readonly ramaService: RamaService) { }

  @Get()
  @Roles('master', 'dirigente', 'beneficiario')
  @HttpCode(HttpStatus.OK)
  async getAllRamas() {
    return await this.ramaService.getAllRama();
  }

  @Get(':id')
  @Roles('master', 'dirigente', 'beneficiario')
  @HttpCode(HttpStatus.OK)
  async getRamaById(@Param('id') id: string) {
    return await this.ramaService.getById(id);
  }

  @Post()
  @Roles('master')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateRamaDTO) {
    return await this.ramaService.create(body);
  }

  @Patch(':id')
  @Roles('master')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateRamaDTO) {
    return await this.ramaService.update(id, body);
  }

  @Delete(':id')
  @Roles('master')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.ramaService.delete(id);
    return;
  }
}

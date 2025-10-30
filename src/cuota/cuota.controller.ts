import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus, Request} from '@nestjs/common';
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
  async getAllCuotas(@Request() req: any) {
    return await this.cuotaService.getAllCuota(req.user, req.user?.id);
  }

  @Get(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async getCuotaById(@Param('id') id: string, @Request() req: any) {
    return await this.cuotaService.getById(id, req.user, req.user?.id);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCuotaDTO, @Request() req: any) {
    return await this.cuotaService.create(body, req.user?.id);
  }

  @Patch(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateCuotaDTO, @Request() req: any) {
    return await this.cuotaService.update(id, body, req.user, req.user?.id);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.cuotaService.delete(id, req.user, req.user?.id);
    return;
  }
}

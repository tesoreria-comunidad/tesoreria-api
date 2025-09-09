import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { RamaService } from './rama.service';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('rama')
export class RamaController {
  constructor(private readonly ramaService: RamaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllRamas() {
    return await this.ramaService.getAllRama();
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE', 'BENEFICIARIO')
  @HttpCode(HttpStatus.OK)
  async getRamaById(@Param('id') id: string, @Request() req: any) {
    return await this.ramaService.getById(id, req.user);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateRamaDTO) {
    return await this.ramaService.create(body);
  }

  @Patch(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRamaDTO,
    @Request() req: any,
  ) {
    return await this.ramaService.update(id, body, req.user);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.ramaService.delete(id, req.user);
    return;
  }
}

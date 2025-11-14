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
  Req,
} from '@nestjs/common';
import { RamaService } from './rama.service';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Request as ExpressRequest } from 'express';

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
  async getRamaById(@Param('id') id: string, @Req() req: ExpressRequest) {
    return await this.ramaService.getById(id, req);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateRamaDTO, @Req() req: ExpressRequest) {
    return await this.ramaService.create(body, req);
  }

  @Patch(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRamaDTO,
    @Req() req: ExpressRequest,
  ) {
    return await this.ramaService.update(id, body, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: ExpressRequest) {
    await this.ramaService.delete(id, req);
    return;
  }
}

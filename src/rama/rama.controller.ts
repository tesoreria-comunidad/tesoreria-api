import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus, Request} from '@nestjs/common';
import { RamaService } from './rama.service';
import { CreateRamaDTO, UpdateRamaDTO } from './dto/rama.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
@UseGuards(AuthGuard)
@Controller('rama')
export class RamaController {
  constructor(private readonly ramaService: RamaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllRamas(@Request() req: any) {
    return await this.ramaService.getAllRama(req.user);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getRamaById(@Param('id') id: string, @Request() req: any) {
    return await this.ramaService.getById(id, req.user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateRamaDTO) {
    return await this.ramaService.create(body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateRamaDTO, @Request() req: any) {
    return await this.ramaService.update(id, body, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.ramaService.delete(id, req.user);
    return;
  }
}

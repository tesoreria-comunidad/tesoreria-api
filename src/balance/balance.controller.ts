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
import { BalanceService } from './balance.service';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getAllBalances(@Request() req: any) {
    return await this.balanceService.getAllBalances(req.user);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  @HttpCode(HttpStatus.OK)
  async getBalanceById(@Param('id') id: string, @Request() req: any) {
    return await this.balanceService.getById(id, req.user);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateBalanceDTO) {
    return await this.balanceService.create(body);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBalanceDTO,
    @Request() req: any,
  ) {
    return await this.balanceService.update(id, body, req.user);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.balanceService.delete(id, req.user);
    return;
  }
}

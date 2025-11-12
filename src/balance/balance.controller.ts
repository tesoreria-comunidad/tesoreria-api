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
import { BalanceService } from './balance.service';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
// using Nest's @Request() typing (any) for controller handlers
@UseGuards(AuthGuard, RolesGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getAllBalances(@Req() req: any) {
    return await this.balanceService.getAllBalances(req);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  @HttpCode(HttpStatus.OK)
  async getBalanceById(@Param('id') id: string, @Req() req: any) {
    return await this.balanceService.getById(id, req);
  }

  @Post()
  @Roles('MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateBalanceDTO, @Req() req: any) {
    return await this.balanceService.create(body, req);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBalanceDTO,
    @Req() req: any,
  ) {
    return await this.balanceService.update(id, body, req);
  }
  @Post('/reset-all')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async ResetAll(@Req() req: any) {
    return await this.balanceService.resetAll(req);
  }
  @Post('/update-family/:id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async updateFamilyBalance(@Param('id') id: string) {
    return await this.balanceService.updateBalanceForFamily(id);
  }
  @Post('/update-all')
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async UpdateAll(@Req() req: any) {
    return await this.balanceService.updateAll(req);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.balanceService.delete(id, req);
    return;
  }
}

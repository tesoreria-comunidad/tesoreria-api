import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { CreateBalanceDTO, UpdateBalanceDTO } from './dto/balance.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  async getAllBalances() {
    return await this.balanceService.getAllBalances();
  }

  @Get(':id')
  async getBalanceById(@Param('id') id: string) {
    return await this.balanceService.getById(id);
  }


  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateBalanceDTO) {
    try {
      return await this.balanceService.update(id, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.balanceService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}

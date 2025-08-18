import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  ParseUUIDPipe,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from './dto/transactions.dto';
import { BulkCreateTransactionDTO } from './dto/bulk-transaction.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Get()
  @Roles('master', 'dirigente')

  async findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user);
  }

  @Get(':id')
  @Roles('master', 'dirigente')

  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.transactionsService.findOne(id, req.user);
  }

  @Post()
  @Roles('master', 'dirigente')
  async create(@Body() dto: CreateTransactionDTO) {
    return this.transactionsService.create(dto);
  }

  @Patch(':id')
  @Roles('master', 'dirigente')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDTO,
    @Request() req: any,
  ) {
    return this.transactionsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('master')

  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.transactionsService.remove(id, req.user);
  }

  @Post('bulk')
  async bulkCreate(@Body() body: BulkCreateTransactionDTO) {
    return this.transactionsService.bulkCreate(body.transactions);
  }
  @Get('stats/monthly')
  async getMonthlyStats(@Request() req: any) {
    return this.transactionsService.getMonthlyStats(req.user);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from './dto/transactions.dto';
import { BulkCreateTransactionDTO } from './dto/bulk-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTransactionDTO) {
    return this.transactionsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDTO,
  ) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.remove(id);
  }

  @Post('bulk')
  async bulkCreate(@Body() body: BulkCreateTransactionDTO) {
    return this.transactionsService.bulkCreate(body.transactions);
  }
  @Get('stats/monthly')
  async getMonthlyStats() {
    return this.transactionsService.getMonthlyStats();
  }
}

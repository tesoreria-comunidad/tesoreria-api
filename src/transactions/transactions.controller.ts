import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  ParseUUIDPipe,
  Patch,
  Request,
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
  async findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user);
  }

  @Get(':id') 
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.transactionsService.findOne(id, req.user);
  }

  @Post()
  async create(@Body() dto: CreateTransactionDTO) {
    return this.transactionsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDTO,
    @Request() req: any,
  ) {
    return this.transactionsService.update(id, dto, req.user);
  }

  @Delete(':id')
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

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
  BadRequestException,
  UploadedFile,
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
import { Request as ExpressRequest } from 'express';
@UseGuards(AuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  async findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user);
  }

  @Get('/category-list')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  async getCategoryList() {
    return await this.transactionsService.getCategories();
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }
  @Get('/by-family/:id')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  async getGyFamilyId(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findByFamilyId(id);
  }

  @Post()
  @Roles('MASTER', 'DIRIGENTE')
  async create(
    @Body() dto: CreateTransactionDTO,
    @Request() req: ExpressRequest,
  ) {
    return this.transactionsService.create(dto, req);
  }

  @Post('/family-cuota')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  async createFamilyTransaction(
    @Body()
    dto: Omit<CreateTransactionDTO, 'direction' | 'category' | 'concept'>,
    @Request() req: ExpressRequest,
  ) {
    // This endpoint creates a transaction with direction INCOME, category CUOTA, and concept "Cuota familiar - {fecha actual}", and update the balance of the family"
    if (!dto.id_family) {
      throw new BadRequestException('id_family is required');
    }
    return await this.transactionsService.createFamilyTransaction(dto, req);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDTO,
    @Request() req: ExpressRequest,
  ) {
    return this.transactionsService.update(id, dto, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: ExpressRequest,
  ) {
    return this.transactionsService.remove(id, req);
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

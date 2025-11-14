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
  Req,
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
  async findAll(@Req() req: ExpressRequest) {
    return this.transactionsService.findAll(req);
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
  async create(@Body() dto: CreateTransactionDTO, @Req() req: ExpressRequest) {
    return this.transactionsService.create(dto, req);
  }

  @Post('/family-cuota')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  async createFamilyTransaction(
    @Body()
    dto: Omit<CreateTransactionDTO, 'direction' | 'category' | 'concept'>,
    @Req() req: ExpressRequest,
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
    @Req() req: ExpressRequest,
  ) {
    return this.transactionsService.update(id, dto, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: ExpressRequest) {
    return this.transactionsService.remove(id, req);
  }

  @Post('bulk')
  async bulkCreate(@Body() body: BulkCreateTransactionDTO, @Req() req: ExpressRequest) {
    return this.transactionsService.bulkCreate(body.transactions, req);
  }

  @Get('/by-rama/:id_rama')
  @Roles('MASTER', 'DIRIGENTE')
  getTransactionsByRama(@Param("id_rama") id_rama: string) {
    return this.transactionsService.getTransactionsByFamily(id_rama);
  }

  @Get('stats/monthly')
  async getMonthlyStats(@Req() req: ExpressRequest) {
    return this.transactionsService.getMonthlyStats(req);
  }

  @Post('bulk-community')
  @Roles('MASTER', 'DIRIGENTE')
  @UseGuards(AuthGuard, RolesGuard)
  async bulkCommunityTransactions(
    @Body() body: BulkCreateTransactionDTO,
    @Req() req: ExpressRequest,
  ) {
    return this.transactionsService.bulkCommunityTransactions(body.transactions, req);
  }
}

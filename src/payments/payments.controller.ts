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
  NotFoundException,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { FamilyService } from 'src/family/family.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Request as ExpressRequest } from 'express';

@UseGuards(AuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly familyService: FamilyService,
  ) { }

  @Post()
  @Roles('MASTER', 'DIRIGENTE', 'BENEFICIARIO')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: ExpressRequest) {
    try {
      const family = await this.familyService.findOne(
        createPaymentDto.id_family,
      );

      if (!family) {
        throw new NotFoundException('family not found');
      }

      return this.paymentsService.create(createPaymentDto, req);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  findAll(@Req() req: ExpressRequest) {
    return this.paymentsService.findAll(req);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @Req() req: ExpressRequest) {
    return this.paymentsService.findOne(id, req);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Req() req: ExpressRequest) {
    return this.paymentsService.update(id, updatePaymentDto, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: ExpressRequest) {
    return this.paymentsService.remove(id, req);
  }
}

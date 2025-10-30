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
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { FamilyService } from 'src/family/family.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

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
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    try {
      const family = await this.familyService.findOne(
        createPaymentDto.id_family,
      );

      if (!family) {
        throw new NotFoundException('family not found');
      }

  return this.paymentsService.create(createPaymentDto, req.user, req.user?.id);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  findAll(@Request() req: any) {
  return this.paymentsService.findAll(req.user, req.user?.id);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @Request() req: any) {
  return this.paymentsService.findOne(id, req.user, req.user?.id);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req: any) {
  return this.paymentsService.update(id, updatePaymentDto, req.user, req.user?.id);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
  return this.paymentsService.remove(id, req.user, req.user?.id);
  }
}

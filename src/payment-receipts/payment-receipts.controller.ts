import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PaymentReceiptsService } from './payment-receipts.service';
import { FileService } from 'src/file/file.service';
import { Request as ExpressRequest } from 'express';
import { LoggedUser } from 'src/auth/types';

@ApiTags('payment-receipts')
@UseGuards(AuthGuard, RolesGuard)
@Controller('payment-receipts')
export class PaymentReceiptsController {
  constructor(
    private readonly paymentReceiptsService: PaymentReceiptsService,
    private readonly fileService: FileService,
  ) {}

  @Get('by-transaction/:transactionId')
  @Roles('MASTER', 'FAMILY', 'BENEFICIARIO')
  @ApiOperation({ summary: 'Obtener comprobante de pago por ID de transacción' })
  @ApiResponse({ status: 200, description: 'Comprobante encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para ver este comprobante' })
  @ApiResponse({ status: 404, description: 'Comprobante no encontrado' })
  async findByTransaction(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Req() req: ExpressRequest & { user: LoggedUser },
  ) {
    const receipt = await this.paymentReceiptsService.findByTransactionId(transactionId, req.user);
    const pdf_url = await this.fileService.getSignedUrl(receipt.pdf_url);
    return { ...receipt, pdf_url };
  }
}

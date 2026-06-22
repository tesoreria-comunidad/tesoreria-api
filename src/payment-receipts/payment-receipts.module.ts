import { Module } from '@nestjs/common';
import { PaymentReceiptsController } from './payment-receipts.controller';
import { PaymentReceiptsService } from './payment-receipts.service';
import { ReceiptPdfService } from './receipt-pdf.service';
import { PrismaService } from 'src/prisma.service';
import { FileModule } from 'src/file/file.module';
import { ActionLogsModule } from 'src/action-logs/action-logs.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [FileModule, ActionLogsModule, AuthModule, UserModule],
  controllers: [PaymentReceiptsController],
  providers: [PaymentReceiptsService, ReceiptPdfService, PrismaService],
  exports: [PaymentReceiptsService],
})
export class PaymentReceiptsModule {}

import { Injectable, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FileService } from 'src/file/file.service';
import { ReceiptPdfService } from './receipt-pdf.service';
import { EmailService } from 'src/auth/email/email.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType, ActionTargetTable, PaymentReceipt, Transactions, Family } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { LoggedUser } from 'src/auth/types';

@Injectable()
export class PaymentReceiptsService {
  private readonly logger = new Logger(PaymentReceiptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly receiptPdfService: ReceiptPdfService,
    private readonly emailService: EmailService,
    private readonly actionLogsService: ActionLogsService,
  ) {}

  /**
   * Generates a receipt for a CUOTA transaction. Called right after the atomic
   * prisma.$transaction in TransactionsService.createFamilyTransaction().
   *
   * Failures in PDF generation or email sending are swallowed so that the
   * parent payment is never rolled back (CA-07).
   */
  async generateAndSendReceipt(
    transaction: Transactions,
    family: Family,
    reqOrActor: ExpressRequest | 'SYSTEM',
  ): Promise<PaymentReceipt | null> {
    // 1) Generate receipt number
    let receiptNumber: string;
    try {
      receiptNumber = await this.nextReceiptNumber();
    } catch (err) {
      this.logger.error('Error generating receipt number', err);
      return null;
    }

    // 2) Build PDF buffer
    let pdfBuffer: Buffer;
    try {
      const now = transaction.payment_date ?? transaction.createdAt;
      const cuotaMes = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      pdfBuffer = await this.receiptPdfService.generateReceiptPdf({
        receiptNumber,
        familyName: family.name,
        amount: transaction.amount,
        paymentDate: now,
        paymentMethod: transaction.payment_method,
        cuotaMes,
      });
    } catch (err) {
      this.logger.error('Error generating PDF for receipt', err);
      return null;
    }

    // 3) Upload PDF to S3/R2
    let pdfUrl: string;
    try {
      const fakeFile: Express.Multer.File = {
        fieldname: 'receipt',
        originalname: `${receiptNumber}.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
        size: pdfBuffer.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };
      const { fileKey } = await this.fileService.uploadBuffer(fakeFile, reqOrActor);
      pdfUrl = fileKey;
    } catch (err) {
      this.logger.error('Error uploading PDF to storage', err);
      return null;
    }

    // 4) Persist PaymentReceipt record
    let receipt: PaymentReceipt;
    try {
      receipt = await this.prisma.paymentReceipt.create({
        data: {
          id_transaction: transaction.id,
          id_family: family.id,
          receipt_number: receiptNumber,
          pdf_url: pdfUrl,
        },
      });
    } catch (err) {
      this.logger.error('Error persisting PaymentReceipt', err);
      return null;
    }

    // 5) Register RECEIPT_CREATE action log
    try {
      const { log } = await this.actionLogsService.start(
        ActionType.RECEIPT_CREATE,
        reqOrActor,
        {
          target_table: ActionTargetTable.PAYMENT_RECEIPT,
          target_id: receipt.id,
          id_family: family.id,
          id_transaction: transaction.id,
        },
      );
      await this.actionLogsService.markSuccess(log.id, `Comprobante ${receiptNumber} generado`, {
        receiptId: receipt.id,
        receiptNumber,
        pdfUrl,
      });
    } catch (err) {
      this.logger.warn('Error registering RECEIPT_CREATE action log', err);
    }

    // 6) Send email if family has one
    const emailTarget = family.email;
    if (emailTarget) {
      try {
        await this.emailService.sendReceiptEmail(emailTarget, {
          familyName: family.name,
          receiptNumber,
          pdfBuffer,
        });

        // Update receipt with email info
        receipt = await this.prisma.paymentReceipt.update({
          where: { id: receipt.id },
          data: { sent_to_email: emailTarget, sent_at: new Date() },
        });

        try {
          const { log } = await this.actionLogsService.start(
            ActionType.RECEIPT_EMAIL_SENT,
            reqOrActor,
            {
              target_table: ActionTargetTable.PAYMENT_RECEIPT,
              target_id: receipt.id,
              id_family: family.id,
              id_transaction: transaction.id,
            },
          );
          await this.actionLogsService.markSuccess(log.id, `Email enviado a ${emailTarget}`);
        } catch (logErr) {
          this.logger.warn('Error registering RECEIPT_EMAIL_SENT action log', logErr);
        }
      } catch (emailErr) {
        this.logger.error(`Error sending receipt email to ${emailTarget}`, emailErr);

        try {
          const { log } = await this.actionLogsService.start(
            ActionType.RECEIPT_EMAIL_FAILED,
            reqOrActor,
            {
              target_table: ActionTargetTable.PAYMENT_RECEIPT,
              target_id: receipt.id,
              id_family: family.id,
              id_transaction: transaction.id,
            },
          );
          await this.actionLogsService.markError(log.id, emailErr as Error);
        } catch (logErr) {
          this.logger.warn('Error registering RECEIPT_EMAIL_FAILED action log', logErr);
        }
      }
    }

    return receipt;
  }

  async findByTransactionId(
    transactionId: string,
    requestingUser: LoggedUser,
  ): Promise<PaymentReceipt> {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id_transaction: transactionId },
    });

    if (!receipt) {
      throw new NotFoundException(`No hay comprobante para la transacción ${transactionId}`);
    }

    // Access control: FAMILY and BENEFICIARIO can only see their own family receipt
    const role = requestingUser.role;
    if (role === 'FAMILY' || role === 'BENEFICIARIO') {
      if (receipt.id_family !== requestingUser.id_family) {
        throw new ForbiddenException('No tenés permiso para ver este comprobante');
      }
    }

    return receipt;
  }

  private async nextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();

    // Ensure sequence exists
    await this.prisma.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS receipt_seq_${year} START 1`,
    );

    const result = await this.prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
      `SELECT nextval('receipt_seq_${year}')`,
    );

    const n = Number(result[0].nextval);
    const padded = String(n).padStart(5, '0');
    return `REC-${year}-${padded}`;
  }
}

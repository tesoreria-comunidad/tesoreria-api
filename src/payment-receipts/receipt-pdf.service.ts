import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface ReceiptPdfData {
  receiptNumber: string;
  familyName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  cuotaMes: string; // e.g. "Junio 2026"
  scoutGroupName?: string;
}

@Injectable()
export class ReceiptPdfService {
  private readonly logger = new Logger(ReceiptPdfService.name);
  private readonly scoutGroupName: string;

  constructor() {
    this.scoutGroupName = process.env.SCOUT_GROUP_NAME ?? 'Grupo Scout Mi Pelícano';
  }

  async generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const groupName = data.scoutGroupName ?? this.scoutGroupName;

        // ---- Header ----
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(groupName, { align: 'center' });

        doc.moveDown(0.5);
        doc
          .fontSize(14)
          .font('Helvetica')
          .text('COMPROBANTE DE PAGO DE CUOTA', { align: 'center' });

        doc.moveDown(1);
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#cccccc')
          .stroke();
        doc.moveDown(1);

        // ---- Receipt number ----
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Nº de comprobante: ', { continued: true })
          .font('Helvetica')
          .text(data.receiptNumber);

        doc.moveDown(0.5);

        // ---- Body ----
        const formattedDate = data.paymentDate.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        const formattedAmount = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
        }).format(data.amount);

        const rows: [string, string][] = [
          ['Familia:', data.familyName],
          ['Concepto:', `Cuota mensual — ${data.cuotaMes}`],
          ['Fecha de pago:', formattedDate],
          ['Método de pago:', this.formatPaymentMethod(data.paymentMethod)],
          ['Monto pagado:', formattedAmount],
        ];

        for (const [label, value] of rows) {
          doc.moveDown(0.5);
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(` ${value}`);
        }

        doc.moveDown(1.5);
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#cccccc')
          .stroke();
        doc.moveDown(1);

        // ---- Footer ----
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text('Este documento es un comprobante oficial de pago emitido por el sistema de tesorería.', {
            align: 'center',
          });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private formatPaymentMethod(method: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA: 'Transferencia bancaria',
    };
    return map[method] ?? method;
  }
}

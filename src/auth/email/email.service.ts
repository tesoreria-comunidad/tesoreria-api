import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private compileTemplate(templateName: string, context: Record<string, unknown>): string {
    const candidates = [
      path.join(__dirname, 'templates', `${templateName}.hbs`),
      path.join(process.cwd(), 'src', 'auth', 'email', 'templates', `${templateName}.hbs`),
    ];
    const templatePath = candidates.find((p) => fs.existsSync(p));
    if (!templatePath) throw new Error(`Email template '${templateName}' not found`);
    const source = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(source)(context);
  }

  async sendReceiptEmail(
    to: string,
    data: { familyName: string; receiptNumber: string; pdfBuffer: Buffer },
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to,
        subject: `Mi Pelicano — Comprobante de pago ${data.receiptNumber}`,
        text: `Estimada familia ${data.familyName},\n\nAdjuntamos el comprobante de pago de cuota Nº ${data.receiptNumber}.\n\nGracias.\n${process.env.SCOUT_GROUP_NAME ?? 'Grupo Scout Mi Pelícano'}`,
        attachments: [
          {
            filename: `${data.receiptNumber}.pdf`,
            content: data.pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      this.logger.log(`Comprobante ${data.receiptNumber} enviado a: ${to}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar comprobante ${data.receiptNumber}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string, name?: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const html = this.compileTemplate('reset-password', {
      name: name ?? 'usuario',
      resetUrl,
    });

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to,
        subject: 'Mi Pelicano — Recuperación de contraseña',
        html,
        text: `Recuperación de contraseña — Mi Pelícano\n\nHacé clic en el siguiente enlace para restablecer tu contraseña (válido por 24 hs):\n${resetUrl}\n\nSi no solicitaste este cambio, ignorá este correo.`,
      });
      this.logger.log(`Email de recuperación enviado a: ${to}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar email de recuperación`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}

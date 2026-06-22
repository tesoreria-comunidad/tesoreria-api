import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class FileService {
  private s3: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService, private actionLogsService: ActionLogsService, private authService: AuthService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.configService.get('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
    });
    this.bucketName = this.configService.get('R2_BUCKET_NAME')!;
  }

  /**
   * Upload a Buffer directly (used internally by PaymentReceiptsService).
   * The file argument only needs fieldname, originalname, mimetype, buffer and size.
   */
  async uploadBuffer(file: Pick<Express.Multer.File, 'fieldname' | 'originalname' | 'mimetype' | 'buffer' | 'size'>, reqOrActor?: ExpressRequest | 'SYSTEM') {
    return this.upload(file as Express.Multer.File, reqOrActor);
  }

  async upload(file: Express.Multer.File, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      const fileKey = `comprobantes/${Date.now()}-${uuid()}-${file.originalname}`;

      const { log } = await this.actionLogsService.start(ActionType.FILE_UPLOAD, reqOrActor ?? 'SYSTEM', {
        metadata: { originalName: file.originalname },
      });

      try {
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            ContentType: file.mimetype,
            Key: fileKey,
            Body: file.buffer,
          }),
        );

        await this.actionLogsService.markSuccess(log.id, 'File uploaded', { fileKey });

        return { fileKey };
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      console.log('Error al subir el archivo', error);
      throw new Error('Error al subir el archivo');
    }
  }

  async getSignedUrl(fileKey: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async delete(fileName: string, reqOrActor?: ExpressRequest | 'SYSTEM') {
    try {
      const { log } = await this.actionLogsService.start(ActionType.FILE_DELETE, reqOrActor ?? 'SYSTEM', {
        metadata: { fileName },
      });
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
          }),
        );
        await this.actionLogsService.markSuccess(log.id, 'File deleted', { fileName });
        return { message: `File ${fileName} deleted successfully` };
      } catch (error) {
        await this.actionLogsService.markError(log.id, error as Error);
        throw error;
      }
    } catch (error) {
      console.log('Error al eliminar el archivo', error);
      throw new Error('Error al eliminar el archivo');
    }
  }
}

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { ActionLogsService } from 'src/action-logs/action-logs.service';
import { ActionType } from '@prisma/client';
// FILE_UPLOAD/FILE_DELETE were added to schema.prisma; now using typed ActionType values.

@Injectable()
export class FileService {
  private s3: S3Client;
  private bucketName: string;
  //   private readonly s3Client =
  constructor(private readonly configService: ConfigService, private actionLogsService: ActionLogsService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = this.configService.get('AWS_BUCKET_NAME')!;
  }

  async upload(file: Express.Multer.File) {
    try {
      const fileKey = `${Date.now()}-${uuid()}-${file.originalname}`;

      const log = await this.actionLogsService.start(ActionType.FILE_UPLOAD, 'system', {
        metadata: { originalName: file.originalname },
      });

      try {
        const res = await this.s3.send(
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
      }
    catch (error) {
      console.log('Error al subir el archivo', error);
      throw new Error('Error al subir el archivo');
    }
  }

  async delete(fileName: string) {
    try {
      const log = await this.actionLogsService.start(ActionType.FILE_DELETE, 'system', {
        metadata: { fileName },
      });
      try {
        const bucketName = this.bucketName;
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
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

// FileService

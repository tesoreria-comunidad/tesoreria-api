import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
@Injectable()
export class FileService {
  private s3: S3Client;
  private bucketName: string;
  //   private readonly s3Client =
  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = this.configService.get('AWS_BUCKET_NAME')!;
  }

  async upload(file: Express.Multer.File, token: string, family_id: string) {
    const fileKey = `${Date.now()}-${uuid()}-${file.originalname}`;
    const res = await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        Metadata: {
          family_id, // <-- FAMILIA VILLANUEVA HARCODED
          token: token, // <-- valor dinámico si querés
        },
      }),
    );

    return {
      ...res,
      fileKey,
    };
  }

  async delete(fileName: string) {
    const bucketName = 'reservepro-media';

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }),
    );

    return { message: `File ${fileName} deleted successfully` };
  }
}

// FileService

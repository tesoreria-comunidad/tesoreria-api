import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Request as ExpressRequest } from 'express';
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest,
  ) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return await this.fileService.upload(file);
  }
}

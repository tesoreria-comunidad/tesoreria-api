import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Request as ExpressRequest } from 'express';
@UseGuards(AuthGuard)
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: ExpressRequest,
  ) {
    // AuthGuard ensures req.user is available
    return await this.fileService.upload(file, req);
  }
}

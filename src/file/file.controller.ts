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
    @Body() body: { family_id: string }, // Adjust the type as needed
  ) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    if (!body.family_id) {
      throw new UnauthorizedException('Missing family_id in request body');
    }
    return await this.fileService.upload(file, token, body.family_id);
  }
}

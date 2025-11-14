import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FolderService } from './folder.service';
import { CreateFolderDTO, UpdateFolderDTO } from './dto/folder.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) { }

  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getAllFolders(@Req() req: ExpressRequest) {
    return await this.folderService.getAllFolder(req);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getFolderById(@Param('id') id: string, @Req() req: ExpressRequest) {
    return await this.folderService.getById(id, req);
  }

  @Post()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateFolderDTO, @Req() req: ExpressRequest) {
    return await this.folderService.create(body, req);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateFolderDTO, @Req() req: ExpressRequest) {
    return await this.folderService.update(id, body, req);
  }

  @Delete(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: ExpressRequest) {
    await this.folderService.delete(id, req);
    return;
  }
}

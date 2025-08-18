import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
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
  async getAllFolders(@Request() req: any) {
    return await this.folderService.getAllFolder(req.user);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getFolderById(@Param('id') id: string, @Request() req: any) {
    return await this.folderService.getById(id, req.user);
  }

  @Post()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateFolderDTO) {
    return await this.folderService.create(body);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: UpdateFolderDTO, @Request() req: any) {
    return await this.folderService.update(id, body, req.user);
  }

  @Delete(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.folderService.delete(id, req.user);
    return;
  }
}

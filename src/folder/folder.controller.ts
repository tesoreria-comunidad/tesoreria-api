import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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
  async getAllFolders() {
    return await this.folderService.getAllFolder();
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getFolderById(@Param('id') id: string) {
    return await this.folderService.getById(id);
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
  async update(@Param('id') id: string, @Body() body: UpdateFolderDTO) {
    return await this.folderService.update(id, body);
  }

  @Delete(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.folderService.delete(id);
    return;
  }
}

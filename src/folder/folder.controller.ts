import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDTO, UpdateFolderDTO } from './dto/folder.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Get()
  async getAllFolders() {
    return await this.folderService.getAllFolder();
  }

  @Get(':id')
  async getFolderById(@Param('id') id: string) {
    return await this.folderService.getById(id);
  }

  @Post()
  async create(@Body() body: CreateFolderDTO) {
    try {
      return await this.folderService.create(body);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateFolderDTO) {
    try {
      return await this.folderService.update(id, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.folderService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}

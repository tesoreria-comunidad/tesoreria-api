import { Injectable } from '@nestjs/common';
import { PrismaClient, Folder } from '@prisma/client';
import { CreateFolderDTO, UpdateFolderDTO } from './dto/folder.dto';

@Injectable()
export class FolderService {
  private prisma = new PrismaClient();

  public async getAllFolder() {
    return this.prisma.folder.findMany({
      include: {
        user: true,
      },
    });
  }

  public async getById(id: string) {
    return await this.prisma.folder.findFirst({ 
      where: { id },
      include: {
        user: true,
      },
    });
  }

  public async create(data: CreateFolderDTO) {
    return this.prisma.folder.create({ 
      data,
      include: {
        user: true,
      },
    });
  }

  public async update(id: string, data: UpdateFolderDTO) {
    return this.prisma.folder.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  public async delete(id: string) {
    return this.prisma.folder.delete({
      where: { id },
    });
  }

  public async findBy({
    key,
    value,
  }: {
    key: keyof Folder;
    value: string;
  }) {
    return this.prisma.folder.findFirst({ where: { [key]: value } });
  }
}

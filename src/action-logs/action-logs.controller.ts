import { Body, Controller, Get, Post } from '@nestjs/common';
import { ActionLogsService } from './action-logs.service';
import { CreateActionLogDto, CreateActionLogSchema } from './dto';

@Controller('action-logs')
export class ActionLogsController {
  constructor(private readonly logService: ActionLogsService) {}

  @Get()
  async list() {
    return await this.logService.getAll();
  }
  @Post()
  async create(@Body() body: CreateActionLogDto) {
    return this.logService.create(body);
  }
}

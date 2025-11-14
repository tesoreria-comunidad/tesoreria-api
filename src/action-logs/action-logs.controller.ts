import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
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
  async create(@Body() body: CreateActionLogDto, @Req() req: ExpressRequest) {
    // Do not decode token in controller; let the service resolve actor when possible.
    return this.logService.create(body as any, req);
  }
}

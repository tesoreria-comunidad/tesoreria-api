import { Body, Controller, Get, Post, Request } from '@nestjs/common';
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
  async create(@Body() body: CreateActionLogDto, @Request() req: any) {
    // If caller doesn't provide id_user, default to the authenticated user if available
    if (!body.id_user && req?.user?.id) {
      (body as any).id_user = req.user.id;
    }
    return this.logService.create(body as any);
  }
}

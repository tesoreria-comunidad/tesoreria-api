import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ChatMessageDto } from './agent.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import LoggedUser from '../auth/types';

@ApiTags('Agent')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Consulta al agente financiero en lenguaje natural' })
  async chat(@Body() dto: ChatMessageDto, @Req() req: Request) {
    const user = req['user'] as LoggedUser;
    const result = await this.agentService.chat(
      dto.message,
      user,
      dto.history ?? [],
    );
    return result;
  }
}

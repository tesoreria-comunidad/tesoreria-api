import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Request as ExpressRequest } from 'express';

@UseGuards(AuthGuard, RolesGuard)
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFamilyDto: CreateFamilyDto, @Req() req: ExpressRequest) {
    return this.familyService.create(createFamilyDto, req);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.familyService.findAll();
  }

  @Get('/by-rama/:id_rama')
  getFamiliesByRama(@Param("id_rama") id_rama: string) {
    return this.familyService.getFamiliesByRama(id_rama);
  }

  @Get(':id')
  @Roles('MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.familyService.findOne(id);
  }

  @Patch(':id')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateFamilyDto: UpdateFamilyDto, @Req() req: ExpressRequest) {
  return this.familyService.update(id, updateFamilyDto, req);
  }

  @Delete(':id')
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: ExpressRequest) {
  return this.familyService.remove(id, req);
  }
}

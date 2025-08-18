import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('family')
export class FamilyController {
    constructor(private readonly familyService: FamilyService) { }

    @Post()
    @Roles('MASTER', 'DIRIGENTE')
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createFamilyDto: CreateFamilyDto) {
        return this.familyService.create(createFamilyDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.familyService.findAll();
    }

    @Get(':id')
    @Roles('MASTER', 'DIRIGENTE')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.familyService.findOne(id);
    }

    @Patch(':id')
    @Roles('MASTER', 'DIRIGENTE')
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: string, @Body() updateFamilyDto: UpdateFamilyDto) {
        return this.familyService.update(id, updateFamilyDto);
    }

    @Delete(':id')
    @Roles('MASTER')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.familyService.remove(id);
    }
}

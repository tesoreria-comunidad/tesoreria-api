import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('family')
export class FamilyController {
    constructor(private readonly familyService: FamilyService) { }

    @Post()
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
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.familyService.findOne(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: string, @Body() updateFamilyDto: UpdateFamilyDto) {
        return this.familyService.update(id, updateFamilyDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.familyService.remove(id);
    }
}

import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { FamilyService } from 'src/family/family.service';
import { NOTFOUND } from 'dns';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService,
        private readonly familyService: FamilyService
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createPaymentDto: CreatePaymentDto) {

        try {
            const family = await this.familyService.findOne(createPaymentDto.id_family)

            if (!family) {
                throw new NotFoundException('family not found')
            }

            return this.paymentsService.create(createPaymentDto);
        } catch (error) {
            throw error
        }
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
        return this.paymentsService.update(id, updatePaymentDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.paymentsService.remove(id);
    }
}

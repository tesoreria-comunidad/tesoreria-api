import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { FamilyService } from 'src/family/family.service';
import { NOTFOUND } from 'dns';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService,
        private readonly familyService: FamilyService
    ) { }

    @Post()
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
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
        return this.paymentsService.update(id, updatePaymentDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.paymentsService.remove(id);
    }
}

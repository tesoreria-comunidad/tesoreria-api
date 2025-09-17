import { Module } from '@nestjs/common';
import { CuotaPorHermanosService } from './cuota-por-hermanos.service';
import { CuotaPorHermanosController } from './cuota-por-hermanos.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CuotaPorHermanosController],
  providers: [CuotaPorHermanosService, PrismaService],
  exports: [CuotaPorHermanosService],
})
export class CuotaPorHermanosModule {}
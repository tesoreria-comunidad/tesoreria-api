import { Module } from '@nestjs/common';
import { CobrabilidadController } from './cobrabilidad.controller';
import { CobrabilidadService } from './cobrabilidad.service';
import { RamaService } from 'src/rama/rama.service';
import { CuotaService } from 'src/cuota/cuota.service';
import { CuotaPorHermanosService } from 'src/cuota-por-hermanos/cuota-por-hermanos.service';
import { BalanceService } from 'src/balance/balance.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { ServicesModule } from 'src/services/services.module';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [UserModule, AuthModule, ServicesModule, PrismaModule],
  controllers: [CobrabilidadController],
  providers: [
    CobrabilidadService,
    RamaService,
    CuotaService,
    CuotaPorHermanosService,
    BalanceService,
  ],
  exports: [CobrabilidadService],
})
export class CobrabilidadModule {}
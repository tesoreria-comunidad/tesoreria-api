import { Module } from '@nestjs/common';
import { CobrabilidadController } from './cobrabilidad.controller';
import { CobrabilidadService } from './cobrabilidad.service';
import { PrismaService } from 'src/prisma.service';
import { RamaService } from 'src/rama/rama.service';
import { CuotaService } from 'src/cuota/cuota.service';
import { CuotaPorHermanosService } from 'src/cuota-por-hermanos/cuota-por-hermanos.service';
import { BalanceService } from 'src/balance/balance.service';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [UserModule, AuthModule],
  controllers: [CobrabilidadController],
  providers: [
    CobrabilidadService,
    PrismaService,
    RamaService,
    CuotaService,
    CuotaPorHermanosService,
    BalanceService,
    RoleFilterService,
  ],
  exports: [CobrabilidadService],
})
export class CobrabilidadModule {}
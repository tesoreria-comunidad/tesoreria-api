import { Module } from '@nestjs/common';
import { CuotaController } from './cuota.controller';
import { CuotaService } from './cuota.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [CuotaController],
  providers: [CuotaService, AuthService, JwtService],
  exports: [CuotaService],
})
export class CuotaModule {}

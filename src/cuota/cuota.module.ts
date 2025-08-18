import { Module } from '@nestjs/common';
import { CuotaController } from './cuota.controller';
import { CuotaService } from './cuota.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [CuotaController],
  providers: [
    UserService,
    CuotaService,
    AuthService,
    JwtService,
    PrismaService,
  ],
  exports: [CuotaService],
})
export class CuotaModule {}

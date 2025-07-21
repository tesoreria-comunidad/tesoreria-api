import { Module } from '@nestjs/common';
import { RamaController } from './rama.controller';
import { RamaService } from './rama.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [RamaController],
  providers: [RamaService, AuthService, JwtService],
  exports: [RamaService],
})
export class RamaModule {}

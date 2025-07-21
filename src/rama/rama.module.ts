import { Module } from '@nestjs/common';
import { RamaController } from './rama.controller';
import { RamaService } from './rama.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [RamaController],
  providers: [UserService, RamaService, AuthService, JwtService],
  exports: [RamaService],
})
export class RamaModule {}

import { Module } from '@nestjs/common';
import { RamaController } from './rama.controller';
import { RamaService } from './rama.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule, AuthModule],
  controllers: [RamaController],
  providers: [UserService, RamaService, JwtService, PrismaService],
  exports: [RamaService],
})
export class RamaModule {}

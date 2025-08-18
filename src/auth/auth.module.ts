import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../prisma.module';
import { UserModule } from '../user/user.module';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [PrismaModule, UserModule, ServicesModule], 
  controllers: [AuthController],
  providers: [AuthService, JwtService], 
  exports: [AuthService],
})
export class AuthModule {}

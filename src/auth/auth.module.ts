import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../prisma.module';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ServicesModule)], 
  controllers: [AuthController],
  providers: [AuthService, JwtService], 
  exports: [AuthService],
})
export class AuthModule {}

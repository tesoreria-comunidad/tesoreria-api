import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../prisma.module';
import { ServicesModule } from 'src/services/services.module';
import { ActionLogsModule } from 'src/action-logs/action-logs.module';
import { EmailService } from './email/email.service';

@Module({
  imports: [PrismaModule, ServicesModule, ActionLogsModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}

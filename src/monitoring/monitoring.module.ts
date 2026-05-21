import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [AuthModule, ServicesModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, PrismaService, UserService, JwtService],
})
export class MonitoringModule {}

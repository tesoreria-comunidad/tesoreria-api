import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [PrismaModule, ServicesModule],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtService],
  exports: [UserService],
})

export class UserModule {}

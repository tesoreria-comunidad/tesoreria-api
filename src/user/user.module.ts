import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { Role } from 'generated/prisma';
import { RoleFilterService } from 'src/services/RoleFilterService';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtService],
  exports: [UserService, RoleFilterService],
})

export class UserModule {}

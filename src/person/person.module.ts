import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { PrismaService } from '../prisma.service';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [PersonController],
  exports: [PersonService],
  providers: [
    PersonService,
    UserService,
    AuthService,
    JwtService,
    PrismaService,
  ],
})
export class PersonModule {}

import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule],
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

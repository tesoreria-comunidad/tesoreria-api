import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { UserService } from 'src/user/user.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule, AuthModule],
  controllers: [PersonController],
  exports: [PersonService],
  providers: [
    PersonService,
    UserService,
    JwtService,
    PrismaService,
  ],
})
export class PersonModule {}

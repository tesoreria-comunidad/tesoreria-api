import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [UserModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class AppModule { }

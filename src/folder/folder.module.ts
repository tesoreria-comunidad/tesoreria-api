import { Module } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [FolderController],
  providers: [
    UserService,
    FolderService,
    AuthService,
    JwtService,
    PrismaService,
  ],
  exports: [FolderService],
})
export class FolderModule {}

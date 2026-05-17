import { Module } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [ServicesModule, AuthModule],
  controllers: [FolderController],
  providers: [
    UserService,
    FolderService,
    JwtService,
    PrismaService,
  ],
  exports: [FolderService],
})
export class FolderModule {}

import { Module } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [FolderController],
  providers: [UserService,FolderService, AuthService, JwtService],
  exports: [FolderService],
})
export class FolderModule {}

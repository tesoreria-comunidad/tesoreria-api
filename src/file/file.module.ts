import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { ConfigModule } from '@nestjs/config';
import { ActionLogsModule } from 'src/action-logs/action-logs.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ConfigModule, ActionLogsModule, UserModule, AuthModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}

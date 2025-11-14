import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma.module';
import { RoleFilterService } from 'src/services/RoleFilter.service';
import { ServicesModule } from 'src/services/services.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, ServicesModule, forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})

export class UserModule {}

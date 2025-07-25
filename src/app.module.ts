import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PaymentsModule } from './payments/payments.module';
import { FamilyModule } from './family/family.module';
import { RamaModule } from './rama/rama.module';
import { FolderModule } from './folder/folder.module';
import { CuotaModule } from './cuota/cuota.module';
import { BalanceModule } from './balance/balance.module';

@Module({
  imports: [UserModule, AuthModule, RamaModule, FolderModule, CuotaModule, BalanceModule, PaymentsModule, FamilyModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, AuthService, JwtService],
})
export class AppModule { }

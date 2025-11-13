import { Module, forwardRef } from '@nestjs/common';
import { CuotaPorHermanosService } from './cuota-por-hermanos.service';
import { CuotaPorHermanosController } from './cuota-por-hermanos.controller';
import { PrismaService } from '../prisma.service';
import { ActionLogsModule } from '../action-logs/action-logs.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ActionLogsModule, forwardRef(() => AuthModule), UserModule],
  controllers: [CuotaPorHermanosController],
  providers: [CuotaPorHermanosService, PrismaService],
  exports: [CuotaPorHermanosService],
})
export class CuotaPorHermanosModule {}
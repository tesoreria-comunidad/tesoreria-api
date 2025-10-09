import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CobrabilidadService } from './cobrabilidad.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('stats/cobrabilidad')
export class CobrabilidadController {
  constructor(private readonly cobrabilidadService: CobrabilidadService) {}

  /**
   * Devuelve la cobrabilidad mensual por rama
   * @param mes Mes numérico (1-12)
   * @param anio Año completo (por ejemplo 2025)
   */
  @Get()
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getCobrabilidadPorRama(
    @Query() query: { month: string; year: string },
  ) {
    try {
      const { month, year } = query;
      const mesNum = parseInt(month, 10);
      const anioNum = parseInt(year, 10);

      if (isNaN(mesNum) || isNaN(anioNum))
        throw new BadRequestException(
          'Los parámetros mes y año deben ser numéricos',
        );

      return await this.cobrabilidadService.calcularCobrabilidadPorRama(
        mesNum,
        anioNum,
      );
    } catch (error) {
      throw error;
    }
  }
}

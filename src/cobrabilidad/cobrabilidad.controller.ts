import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
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
  @Get(':mes/:anio')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  async getCobrabilidadPorRama(
    @Param('mes') mes: string,
    @Param('anio') anio: string,
  ) {
    const mesNum = parseInt(mes, 10);
    const anioNum = parseInt(anio, 10);

    if (isNaN(mesNum) || isNaN(anioNum))
      throw new Error('Los parámetros mes y año deben ser numéricos');

    return await this.cobrabilidadService.calcularCobrabilidadPorRama(
      mesNum,
      anioNum,
    );
  }
}

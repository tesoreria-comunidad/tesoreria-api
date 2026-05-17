import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CobrabilidadService } from './cobrabilidad.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  GetCobrabilidadResumenQuery,
  CobrabilidadResumenDto,
} from './dto/cobrabilidad.dto';

@ApiTags('stats/cobrabilidad')
@ApiBearerAuth()
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

  /**
   * Devuelve el consolidado global de cobrabilidad de todas las ramas para el mes/año indicado.
   */
  @Get('resumen')
  @Roles('MASTER', 'DIRIGENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resumen global de cobrabilidad del mes',
    description:
      'Retorna el total esperado, total cobrado y porcentaje de cobrabilidad consolidado de todas las ramas para un mes y año determinados.',
  })
  @ApiQuery({ name: 'month', required: true, description: 'Mes (1-12)', example: '5' })
  @ApiQuery({ name: 'year', required: true, description: 'Año (YYYY)', example: '2025' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de cobrabilidad obtenido correctamente',
    type: CobrabilidadResumenDto,
  })
  @ApiResponse({ status: 400, description: 'Parámetros month y/o year inválidos o faltantes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos — solo MASTER y DIRIGENTE' })
  async getResumenCobrabilidad(
    @Query() query: GetCobrabilidadResumenQuery,
  ): Promise<CobrabilidadResumenDto> {
    const mesNum = parseInt(query.month, 10);
    const anioNum = parseInt(query.year, 10);

    return this.cobrabilidadService.getResumenCobrabilidad(mesNum, anioNum);
  }
}

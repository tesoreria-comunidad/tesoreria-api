import { IsNumberString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCobrabilidadResumenQuery {
  @ApiProperty({
    description: 'Mes (1-12)',
    example: '5',
  })
  @IsNumberString({}, { message: 'month debe ser un valor numérico' })
  @IsNotEmpty({ message: 'month es requerido' })
  @Matches(/^([1-9]|1[0-2])$/, { message: 'month debe ser un valor entre 1 y 12' })
  month: string;

  @ApiProperty({
    description: 'Año (YYYY)',
    example: '2025',
  })
  @IsNumberString({}, { message: 'year debe ser un valor numérico' })
  @IsNotEmpty({ message: 'year es requerido' })
  year: string;
}

export class CobrabilidadResumenDto {
  @ApiProperty({ description: 'Total esperado de cobros en el mes', example: 50000 })
  totalEsperado: number;

  @ApiProperty({ description: 'Total efectivamente cobrado en el mes', example: 35000 })
  totalCobrado: number;

  @ApiProperty({ description: 'Porcentaje de cobrabilidad redondeado a 1 decimal', example: 70.0 })
  cobrabilidad: number;

  @ApiProperty({ description: 'Mes consultado (1-12)', example: 5 })
  mes: number;

  @ApiProperty({ description: 'Año consultado', example: 2025 })
  anio: number;
}

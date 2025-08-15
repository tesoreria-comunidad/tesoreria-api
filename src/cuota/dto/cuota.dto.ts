import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCuotaDTO {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'cuota_amount debe ser un número válido con máximo 2 decimales',
    },
  )
  @Min(0, { message: 'cuota_amount no puede ser negativo' })
  @IsNotEmpty({ message: 'cuota_amount es requerido' })
  @Transform(({ value }) => parseFloat(value))
  value: number;
}

export class UpdateCuotaDTO {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'cuota_amount debe ser un número válido con máximo 2 decimales',
    },
  )
  @Min(0, { message: 'cuota_amount no puede ser negativo' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : value))
  cuota_amount?: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'cfa_amount debe ser un número válido con máximo 2 decimales' },
  )
  @Min(0, { message: 'cfa_amount no puede ser negativo' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : value))
  cfa_amount?: number;
}

import { IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBalanceDTO {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'value debe ser un número válido con máximo 2 decimales' },
  )
  @IsNotEmpty({ message: 'value es requerido' })
  @Transform(({ value }) => parseFloat(value))
  value: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'cfa_balance_value debe ser un número válido con máximo 2 decimales',
    },
  )
  @IsNotEmpty({ message: 'cfa_balance_value es requerido' })
  @Transform(({ value }) => parseFloat(value))
  cfa_balance_value: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'custom_cuota debe ser un número válido con máximo 2 decimales',
    },
  )
  @IsNotEmpty({ message: 'custom_cuota es requerido' })
  @Transform(({ value }) => parseFloat(value))
  custom_cuota: number;

  @IsNotEmpty({ message: 'custom_cuota es requerido' })
  @Transform(({ value }) => parseFloat(value))
  custom_cfa_value: number;

  @IsBoolean({ message: 'is_custom_cuota debe ser un valor booleano' })
  @IsNotEmpty({ message: 'is_custom_cuota es requerido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_custom_cuota: boolean;

  @IsBoolean({ message: 'is_custom_cfa debe ser un valor booleano' })
  @IsNotEmpty({ message: 'is_custom_cfa es requerido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_custom_cfa: boolean;
}

export class UpdateBalanceDTO {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'value debe ser un número válido con máximo 2 decimales' },
  )
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : value))
  value?: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'cfa_balance_value debe ser un número válido con máximo 2 decimales',
    },
  )
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : value))
  cfa_balance_value?: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'custom_cuota debe ser un número válido con máximo 2 decimales',
    },
  )
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : value))
  custom_cuota?: number;

  @IsBoolean({ message: 'is_custom_cuota debe ser un valor booleano' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_custom_cuota?: boolean;

  @IsBoolean({ message: 'is_custom_cfa debe ser un valor booleano' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_custom_cfa?: boolean;
}

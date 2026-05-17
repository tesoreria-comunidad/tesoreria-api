import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsEnum, IsDateString, Min } from 'class-validator';
import { BalanceChangeType } from '@prisma/client';

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

  @IsString({ message: 'description debe ser un texto' })
  @IsOptional()
  description?: string;
}

export class GetBalanceHistoryQueryDTO {
  @IsEnum(BalanceChangeType, { message: 'type debe ser un valor válido de BalanceChangeType' })
  @IsOptional()
  type?: BalanceChangeType;

  @IsDateString({}, { message: 'from debe ser una fecha ISO válida' })
  @IsOptional()
  from?: string;

  @IsDateString({}, { message: 'to debe ser una fecha ISO válida' })
  @IsOptional()
  to?: string;

  @IsNumber({}, { message: 'take debe ser un número entero' })
  @Min(1, { message: 'take debe ser al menos 1' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  take?: number;

  @IsNumber({}, { message: 'skip debe ser un número entero' })
  @Min(0, { message: 'skip debe ser 0 o mayor' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  skip?: number;
}

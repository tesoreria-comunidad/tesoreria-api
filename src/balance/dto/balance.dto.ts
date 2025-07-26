import { IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateBalanceDTO {
  @IsNumber()
  @IsNotEmpty()
  cuota_balance: number;

  @IsNumber()
  @IsNotEmpty()
  cfa_balance: number;

  @IsNumber()
  @IsNotEmpty()
  custom_balance: number;

  @IsBoolean()
  @IsNotEmpty()
  is_custom_cuota: boolean;

  @IsBoolean()
  @IsNotEmpty()
  is_custom_cfa: boolean;
}

export class UpdateBalanceDTO {
  @IsNumber()
  @IsOptional()
  cuota_balance?: number;

  @IsNumber()
  @IsOptional()
  cfa_balance?: number;

  @IsNumber()
  @IsOptional()
  custom_balance?: number;

  @IsBoolean()
  @IsOptional()
  is_custom_cuota?: boolean;

  @IsBoolean()
  @IsOptional()
  is_custom_cfa?: boolean;
}

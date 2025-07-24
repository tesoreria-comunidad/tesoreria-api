import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCuotaDTO {
  @IsNumber()
  @IsNotEmpty()
  cuota_amount: number;

  @IsNumber()
  @IsNotEmpty()
  cfa_amount: number;
}

export class UpdateCuotaDTO {
  @IsNumber()
  @IsOptional()
  cuota_amount?: number;

  @IsNumber()
  @IsOptional()
  cfa_amount?: number;
}

import { IsInt, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateCuotaPorHermanosDto {
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  valor: number;
}

export class UpdateCuotaPorHermanosDto {
  @IsNumber()
  @Min(0)
  valor: number;
}
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GrupoScout } from '@prisma/client';

export class CreateRamaDTO {
  @IsString({ message: 'name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'name es requerido' })
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'name no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(GrupoScout, { message: 'grupo debe ser SCOUTS o GUIAS' })
  @IsNotEmpty({ message: 'grupo es requerido' })
  grupo: GrupoScout;

  @IsInt({ message: 'orden debe ser un entero' })
  @Min(1, { message: 'orden mínimo es 1' })
  @Max(10, { message: 'orden máximo es 10' })
  orden: number;

  @IsInt({ message: 'edad_min debe ser un entero' })
  @Min(0)
  @IsOptional()
  edad_min?: number;

  @IsInt({ message: 'edad_max debe ser un entero' })
  @Min(0)
  @IsOptional()
  edad_max?: number;
}

export class UpdateRamaDTO {
  @IsString({ message: 'name debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'name no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsInt({ message: 'edad_min debe ser un entero' })
  @Min(0)
  @IsOptional()
  edad_min?: number;

  @IsInt({ message: 'edad_max debe ser un entero' })
  @Min(0)
  @IsOptional()
  edad_max?: number;
}

import { IsNotEmpty, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRamaDTO {
  @IsString({ message: 'name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'name es requerido' })
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'name no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;
}

export class UpdateRamaDTO {
  @IsString({ message: 'name debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'name no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name?: string;
}

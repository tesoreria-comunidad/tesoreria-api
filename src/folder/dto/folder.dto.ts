import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFolderDTO {
  @IsString({ message: 'historia_clinica debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'historia_clinica no puede tener más de 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  historia_clinica?: string;

  @IsString({ message: 'foto debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(300, { message: 'foto no puede tener más de 300 caracteres' })
  @Transform(({ value }) => value?.trim())
  foto?: string;
}

export class UpdateFolderDTO {
  @IsString({ message: 'historia_clinica debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'historia_clinica no puede tener más de 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  historia_clinica?: string;

  @IsString({ message: 'foto debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(300, { message: 'foto no puede tener más de 300 caracteres' })
  @Transform(({ value }) => value?.trim())
  foto?: string;
}

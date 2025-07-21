import { IsOptional, IsString } from 'class-validator';

export class CreateFolderDTO {
  @IsString()
  @IsOptional()
  historia_clinica?: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateFolderDTO {
  @IsString()
  @IsOptional()
  historia_clinica?: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

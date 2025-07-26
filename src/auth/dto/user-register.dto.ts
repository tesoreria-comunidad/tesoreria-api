import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class UserRegisterDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsUUID()
  @IsOptional()
  id_folder?: string;

  @IsUUID()
  @IsOptional()
  id_rama?: string;

  @IsUUID()
  @IsOptional()
  id_person?: string;
}

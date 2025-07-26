import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsUUID()
  id_folder?: string;

  @IsOptional()
  @IsUUID()
  id_rama?: string;

  @IsOptional()
  @IsUUID()
  id_person?: string;
}

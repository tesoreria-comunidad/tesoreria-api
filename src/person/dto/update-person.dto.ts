import { IsString, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdatePersonDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsUUID()
  id_family?: string;
}

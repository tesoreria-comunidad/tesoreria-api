import { IsOptional, IsString, IsUUID, IsEnum, IsEmail } from 'class-validator';
import { Role, Gender } from '@prisma/client';

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

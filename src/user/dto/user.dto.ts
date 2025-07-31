import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsDate } from 'class-validator';
import { Role } from '@prisma/client';
import { Gender } from '@prisma/client';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsOptional()
  @IsUUID()
  id_folder?: string;

  @IsOptional()
  @IsUUID()
  id_rama?: string;

  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  last_name: string;
  
  @IsString()
  @IsNotEmpty()
  address: string;
  
  @IsString()
  @IsNotEmpty()
  phone: string;
  
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
  
  @IsString()
  @IsNotEmpty()
  dni: string;
  
  @IsUUID('4')
  @IsOptional()
  id_family?: string;

  @IsDate()
  @IsNotEmpty()
  birthdate: Date;

  @IsString()
  @IsNotEmpty()
  citizenship: string;
}

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


  
}

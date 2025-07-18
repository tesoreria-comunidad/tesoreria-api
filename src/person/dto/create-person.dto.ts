import { IsString, IsEmail, IsNotEmpty, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePersonDTO {
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

  @IsUUID()
  @IsNotEmpty()
  id_family: string;
}

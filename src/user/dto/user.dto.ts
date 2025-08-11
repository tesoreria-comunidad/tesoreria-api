import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsDate } from 'class-validator';
import { Role } from '@prisma/client';
import { Gender } from '@prisma/client';

export class CreateUserDTO {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  username: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @IsEnum(Role, { message: 'El rol debe ser válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: Role;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de carpeta debe ser un UUID válido' })
  id_folder: string | null;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de rama debe ser un UUID válido' })
  id_rama: string | null;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;
  
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  last_name: string;
  
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  address: string;
  
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone: string;
  
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
  
  @IsEnum(Gender, { message: 'El género debe ser válido' })
  @IsNotEmpty({ message: 'El género es requerido' })
  gender: Gender;
  
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El DNI es requerido' })
  dni: string;
  
  @IsUUID('4', { message: 'El ID de familia debe ser un UUID válido' })
  @IsOptional()
  id_family: string | null;

  @IsDate({ message: 'La fecha de nacimiento debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  birthdate: Date;

  @IsString({ message: 'La ciudadanía debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudadanía es requerida' })
  citizenship: string;
}

export class UpdateUserDTO {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsOptional()
  username?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsOptional()
  password?: string;

  @IsEnum(Role, { message: 'El rol debe ser válido' })
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de carpeta debe ser un UUID válido' })
  id_folder?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de rama debe ser un UUID válido' })
  id_rama?: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  name?: string;
  
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsOptional()
  last_name?: string;
  
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  address?: string;
  
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone?: string;
  
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsOptional()
  email?: string;
  
  @IsEnum(Gender, { message: 'El género debe ser válido' })
  @IsOptional()
  gender?: Gender;
  
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsOptional()
  dni?: string;
  
  @IsUUID('4', { message: 'El ID de familia debe ser un UUID válido' })
  @IsOptional()
  id_family?: string;

  @IsDate({ message: 'La fecha de nacimiento debe ser una fecha válida' })
  @IsOptional()
  birthdate?: Date;

  @IsString({ message: 'La ciudadanía debe ser una cadena de texto' })
  @IsOptional()
  citizenship?: string;
}

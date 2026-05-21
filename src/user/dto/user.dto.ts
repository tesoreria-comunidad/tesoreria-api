import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Role, Gender, familyRole } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateUserDTO {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  username: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  last_name: string;

  @IsEnum(Role, { message: 'El rol debe ser válido' })
  @IsOptional()
  role: Role;

  @IsOptional()
  id_folder: string | null;

  @IsOptional()
  id_rama: string | null;

  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  address: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsEnum(Gender, { message: 'El género debe ser válido' })
  @IsOptional()
  gender: Gender;

  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsOptional()
  dni: string;

  @IsString({ message: 'El id_family debe ser una cadena de texto' })
  @IsOptional()
  id_family: string | null;

  @IsString()
  @IsOptional()
  birthdate: string;

  @IsString({ message: 'La ciudadanía debe ser una cadena de texto' })
  @IsOptional()
  citizenship: string;

  @IsEnum(familyRole, { message: 'El rol familiar debe ser válido' })
  @IsOptional()
  family_role?: familyRole;
}
export class BulkCreateUserDTO {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsOptional()
  username: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  family_id: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  last_name: string;

  @IsEnum(Role, { message: 'El rol debe ser válido' })
  @IsOptional()
  role: Role;

  @IsOptional()
  @IsOptional()
  id_folder: string | null;

  @IsOptional()
  @IsOptional()
  id_rama: string | null;

  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  address: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone: string;

  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsOptional()
  email: string;

  @IsEnum(Gender, { message: 'El género debe ser válido' })
  @IsOptional()
  gender: Gender;

  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsOptional()
  dni: string;

  @IsUUID('4', { message: 'El ID de familia debe ser un UUID válido' })
  @IsOptional()
  id_family: string | null;

  @IsDate({ message: 'La fecha de nacimiento debe ser una fecha válida' })
  @IsOptional()
  birthdate: Date;

  @IsString({ message: 'La ciudadanía debe ser una cadena de texto' })
  @IsOptional()
  citizenship: string;

  @IsEnum(familyRole, { message: 'El rol familiar debe ser válido' })
  @IsOptional()
  family_role?: familyRole;
}

export class UpdateUserRamaDTO {
  @IsUUID('4', { message: 'id_rama debe ser un UUID válido' })
  @IsNotEmpty({ message: 'id_rama es requerido' })
  id_rama: string;
}

export class BulkUpdateRamaDTO {
  @IsArray({ message: 'user_ids debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un ID de usuario' })
  @IsUUID('4', { each: true, message: 'Cada user_id debe ser un UUID válido' })
  user_ids: string[];

  @IsUUID('4', { message: 'id_rama_destino debe ser un UUID válido' })
  @IsNotEmpty({ message: 'id_rama_destino es requerido' })
  id_rama_destino: string;
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
  @Transform(({ value }) => (value === null || value === '' ? undefined : value)) 
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

  @IsEnum(familyRole, { message: 'El rol familiar debe ser válido' })
  @IsOptional()
  family_role?: familyRole;
}

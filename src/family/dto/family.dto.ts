import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, IsEnum, ValidateNested, IsEmail, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, Gender } from '@prisma/client';

export class CreateFamilyAdminUserDto {
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

    @IsDate({ message: 'La fecha de nacimiento debe ser una fecha válida' })
    @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
    @Type(() => Date)
    birthdate: Date;

    @IsString({ message: 'La ciudadanía debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La ciudadanía es requerida' })
    citizenship: string;

    @IsEnum(Role, { message: 'El rol debe ser válido' })
    @IsOptional()
    role?: Role;
}

export class CreateFamilyDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @ValidateNested()
    @Type(() => CreateFamilyAdminUserDto)
    @IsOptional()
    admin_user?: CreateFamilyAdminUserDto;
}

export class UpdateFamilyDto {
    @IsString()
    @IsOptional()
    id_balance?: string;

    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsNotEmpty()
    phone?: string;
}

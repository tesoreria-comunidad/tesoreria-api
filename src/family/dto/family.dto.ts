import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';


export class CreateFamilyDto {
    @IsString()
    @IsNotEmpty()
    id_balance: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;
}

export class UpdateFamilyDto {
    @IsString()
    @IsNotEmpty()
    id_balance?: string;

    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsNotEmpty()
    phone?: string;
}

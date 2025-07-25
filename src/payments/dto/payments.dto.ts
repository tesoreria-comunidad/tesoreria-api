import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreatePaymentDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    id_family: string;

    @IsEnum(['EFECTIVO', 'TRANSFERENCIA'])
    @IsNotEmpty()
    payment_method: 'EFECTIVO' | 'TRANSFERENCIA';

    @IsEnum(['CUOTA', 'CFA'])
    @IsNotEmpty()
    payment_type: 'CUOTA' | 'CFA';
}

export class UpdatePaymentDto {
    @IsNumber()
    @IsOptional()
    amount: number;

    @IsString()
    @IsOptional()
    id_family: string;

    @IsEnum(['EFECTIVO', 'TRANSFERENCIA'])
    @IsOptional()
    payment_method: 'EFECTIVO' | 'TRANSFERENCIA';

    @IsEnum(['CUOTA', 'CFA'])
    @IsOptional()
    payment_type: 'CUOTA' | 'CFA';
}

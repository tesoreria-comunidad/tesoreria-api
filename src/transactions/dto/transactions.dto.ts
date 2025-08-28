import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { TransactionDirection, PaymentMethod } from '../constants';

export class CreateTransactionDTO {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsUUID()
  @IsOptional()
  id_family?: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @IsEnum(TransactionDirection)
  @IsNotEmpty()
  direction: TransactionDirection;

  @IsString()
  @IsNotEmpty()
  category: string; // Dinámico: CUOTA, CFA, o cualquier otra

  @IsDateString()
  @IsOptional()
  payment_date?: string;

  @IsString()
  @IsOptional()
  concept?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTransactionDTO {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsUUID()
  @IsOptional()
  id_family?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsEnum(TransactionDirection)
  @IsOptional()
  direction?: TransactionDirection;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  payment_date?: string;

  @IsString()
  @IsOptional()
  concept?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

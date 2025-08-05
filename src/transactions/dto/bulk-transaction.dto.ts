import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateTransactionDTO } from './transactions.dto';

export class BulkCreateTransactionDTO {
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Debe enviar al menos una transacción' })
  @Type(() => CreateTransactionDTO)
  transactions: CreateTransactionDTO[];
}

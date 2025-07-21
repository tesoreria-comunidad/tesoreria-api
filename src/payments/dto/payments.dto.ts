export class CreatePaymentDto {
    readonly amount: number;
    readonly familyId?: string;
    readonly payment_method: 'EFECTIVO' | 'TRANSFERENCIA';
    readonly payment_type: 'CUOTA' | 'CFA';
}

export class UpdatePaymentDto {
    readonly amount?: number;
    readonly familyId?: string;
    readonly payment_method?: 'EFECTIVO' | 'TRANSFERENCIA';
    readonly payment_type?: 'CUOTA' | 'CFA';
}

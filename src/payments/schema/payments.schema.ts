export class Payment {
    id: string;
    amount: number;
    familyId?: string;
    payment_method: 'EFECTIVO' | 'TRANSFERENCIA';
    payment_type: 'CUOTA' | 'CFA';
}

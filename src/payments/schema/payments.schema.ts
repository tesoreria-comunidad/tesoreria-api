export class Payment {
    id: string;
    amount: number;
    id_family?: string;
    payment_method: 'EFECTIVO' | 'TRANSFERENCIA';
    payment_type: 'CUOTA' | 'CFA';
}

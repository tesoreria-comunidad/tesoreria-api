export class CreateFamilyDto {
    readonly id_balance: string;
    readonly name: string;
    readonly phone: string;
}

export class UpdateFamilyDto {
    readonly id_balance?: string;
    readonly name?: string;
    readonly phone?: string;
}

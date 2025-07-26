import z from 'zod';

export const BalanceSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  cuota_balance: z.number(),
  cfa_balance: z.number(),
  custom_balance: z.number(),
  is_custom_cuota: z.boolean(),
  is_custom_cfa: z.boolean(),
  family: z.any().optional(),
});

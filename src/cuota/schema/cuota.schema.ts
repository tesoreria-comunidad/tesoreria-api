import z from 'zod';

export const CuotaSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  cuota_amount: z.number(),
  cfa_amount: z.number(),
});

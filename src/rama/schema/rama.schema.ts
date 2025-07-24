import { User } from '@prisma/client'
import z from 'zod';

export const RamaSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  users: z.array(z.any()).optional(),
});
import { Role } from '@prisma/client';
import z from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  userName: z.string(),
  password: z.string(),
  email: z.string().email(),
  role: z.enum(Object.values(Role) as [string, ...string[]]),
});

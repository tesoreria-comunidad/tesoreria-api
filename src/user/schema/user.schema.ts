import { Role } from '@prisma/client';
import z from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  userName: z.string(),
  password: z.string(),
  email: z.email(),
  role: z.enum(Role),
});

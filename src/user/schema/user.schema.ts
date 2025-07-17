import { Role } from '@prisma/client';
import z from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  id_folder: z.string(),
  id_rama: z.string(),
  id_person: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.nativeEnum(Role),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  username: z.string(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(32, 'La contraseña no debe exceder 32 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  id_rama: z.string().optional(),
  id_person: z.string().optional(),
  id_folder: z.string().optional(),
});

import { Role, Gender } from '@prisma/client';
import z from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  id_folder: z.string(),
  id_rama: z.string(),
  id_family: z.string(),
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  name: z.string(),
  lastName: z.string(),
  gender: z.nativeEnum(Gender),
  dni: z.string(),
  phone: z.string(),
  address: z.string(),
  birthdate: z.date(),
  citizenship: z.string(),
  is_active: z.boolean(),
  is_granted: z.boolean(),
  role: z.nativeEnum(Role),
  createdAt: z.date(),
  updatedAt: z.date(),
});

//Ver si es necesario
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

import z from 'zod';

export const FolderSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  historia_clinica: z.string().nullable(),
  foto: z.string().nullable(),
  user: z.any().optional(),
});

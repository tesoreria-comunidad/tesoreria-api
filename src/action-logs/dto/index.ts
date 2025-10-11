// src/action-logs/dtos.ts
import { z } from 'zod';
import { ActionType, ActionStatus, ActionTargetTable } from '@prisma/client';

/** Crear log */
export const CreateActionLogSchema = z.object({
  action_type: z.nativeEnum(ActionType),
  id_user: z.string().uuid(),
  target_table: z.nativeEnum(ActionTargetTable).optional(),
  target_id: z.string().min(1).optional(),
  id_family: z.string().min(1).optional(),
  id_transaction: z.string().min(1).optional(),
  status: z.nativeEnum(ActionStatus).optional(),
  message: z.string().optional(),
  requestId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.any().optional(),
});
export type CreateActionLogDto = z.infer<typeof CreateActionLogSchema>;

/** Listado con filtros */
export const ListLogsQuerySchema = z
  .object({
    action_type: z.nativeEnum(ActionType).optional(),
    status: z.nativeEnum(ActionStatus).optional(),
    id_user: z.string().uuid().optional(),

    target_table: z.nativeEnum(ActionTargetTable).optional(),
    target_id: z.string().optional(),

    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),

    take: z.coerce.number().int().min(1).max(200).optional(),
    skip: z.coerce.number().int().min(0).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .refine((v) => !(v.from && v.to) || v.from <= v.to, {
    message: 'El rango de fechas es inválido (from > to).',
  });
export type ListLogsQueryDto = z.infer<typeof ListLogsQuerySchema>;

/** Run balance update (una vez por mes) */
export const RunBalanceUpdateSchema = z.object({
  requestId: z.string().optional(),
  metadata: z.any().optional(),
});
export type RunBalanceUpdateDto = z.infer<typeof RunBalanceUpdateSchema>;

/** (Opcional) Historial por target */
export const ByTargetQuerySchema = z.object({
  target_table: z.nativeEnum(ActionTargetTable),
  target_id: z.string().min(1),
});
export type ByTargetQueryDto = z.infer<typeof ByTargetQuerySchema>;

import {
  ActionStatus,
  ActionTargetTable,
  ActionType,
  Prisma,
} from '@prisma/client';

export type CreateLogInput = {
  action_type: ActionType;
  id_user: string;
  target_table?: ActionTargetTable | null;
  target_id?: string | null;
  id_family?: string | null;
  id_transaction?: string | null;
  status?: ActionStatus | null; // 'PENDING' | 'SUCCESS' | 'ERROR'
  message?: string | null;
  requestId?: string | null; // para idempotencia
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.JsonValue | null;
};

export type ListLogsParams = {
  action_type?: ActionType;
  id_user?: string;
  target_table?: ActionTargetTable | null;
  target_id?: string;
  from?: Date; // rango de fechas opcional
  to?: Date;
  take?: number; // paginación
  skip?: number;
  order?: 'asc' | 'desc';
};

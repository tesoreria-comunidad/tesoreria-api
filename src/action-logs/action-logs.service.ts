// src/action-logs/action-logs.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, ActionType, ActionTargetTable } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateLogInput, ListLogsParams } from './types';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ActionLogsService {
  constructor(private prisma: PrismaService, private authService: AuthService) {}

  /** Helper de rango mensual (inicio/fin de mes del date dado) */
  private getMonthRange(date = new Date()) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    );
    return { start, end };
  }

  /** Crear un log genérico (sin idempotencia) */
  async create(input: CreateLogInput, reqOrActor?: ExpressRequest | string) {
    // If id_user not provided, attempt to resolve it from the request or actor string
    if (!input.id_user) {
      if (typeof reqOrActor === 'string') {
        input.id_user = reqOrActor;
      } else if (reqOrActor) {
        try {
          const user = await this.authService.getDataFromToken(reqOrActor as any);
          input.id_user = (user as any)?.id ?? input.id_user;
        } catch (err) {
          // ignore resolution errors; create will proceed without id_user or caller may have provided it
        }
      }
    }

    return this.prisma.actionLog.create({
      data: {
        action_type: input.action_type,
        id_user: input.id_user,
        target_table: input.target_table ?? null,
        target_id: input.target_id ?? null,
        id_family: input.id_family ?? null,
        id_transaction: input.id_transaction ?? null,
        status: input.status ?? null,
        message: input.message ?? null,
        requestId: input.requestId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  /** Crear un log solo si NO existe ya por requestId (idempotencia a nivel app) */
  async createIfAbsentByRequestId(input: CreateLogInput) {
    if (!input.requestId) {
      // si no llega requestId, delega en create
      return this.create(input);
    }
    const existing = await this.prisma.actionLog.findUnique({
      where: { requestId: input.requestId },
    });
    if (existing) return existing;
    return this.create(input);
  }

  /** Inicia un log estilo “job” como PENDING */
  async start(
    action: ActionType,
    id_user: string,
    extra?: Omit<CreateLogInput, 'action_type' | 'id_user' | 'status'>,
  ) {
    return this.create({
      action_type: action,
      id_user,
      status: 'PENDING',
      ...extra,
    });
  }

  /** Marca log en SUCCESS y opcionalmente acumula metadata */
  async markSuccess(
    id: string,
    message?: string,
    extraMetadata?: Prisma.JsonValue,
  ) {
    const prev = await this.prisma.actionLog.findUnique({ where: { id } });
    return this.prisma.actionLog.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        message: message ?? prev?.message ?? null,
        metadata: extraMetadata
          ? Array.isArray(prev?.metadata) || typeof prev?.metadata === 'object'
            ? {
                ...(prev?.metadata as Record<string, unknown>),
                ...((extraMetadata as any) || {}),
              }
            : extraMetadata
          : prev?.metadata,
      },
    });
  }

  /** Marca log en ERROR y deja el mensaje del error */
  async markError(id: string, error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Error no especificado';
    return this.prisma.actionLog.update({
      where: { id },
      data: {
        status: 'ERROR',
        message,
      },
    });
  }

  async getAll() {
    return await this.prisma.actionLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  /** Listado con filtros comunes */
  async list(params: ListLogsParams = {}) {
    const where: Prisma.ActionLogWhereInput = {
      action_type: params.action_type ?? undefined,
      id_user: params.id_user ?? undefined,
      target_table: params.target_table ?? null,
      target_id: params.target_id ?? undefined,
      createdAt:
        params.from || params.to
          ? {
              gte: params.from ?? undefined,
              lt: params.to ?? undefined,
            }
          : undefined,
    };

    return this.prisma.actionLog.findMany({
      where,
      orderBy: { createdAt: params.order ?? 'desc' },
      take: params.take ?? 50,
      skip: params.skip ?? 0,
    });
  }

  /** Historial por entidad objetivo (tabla + id) */
  async listByTarget(
    target_table: ActionTargetTable,
    target_id: string,
    take = 50,
  ) {
    return this.prisma.actionLog.findMany({
      where: { target_table, target_id },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Último log de un tipo dado */
  async lastOfType(action: ActionType) {
    return this.prisma.actionLog.findFirst({
      where: { action_type: action },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** ¿Ya hubo un BALANCE_UPDATE este mes? (global) */
  async hasBalanceUpdateThisMonth(now = new Date()) {
    const { start, end } = this.getMonthRange(now);
    const found = await this.prisma.actionLog.findFirst({
      where: {
        action_type: ActionType.BALANCE_UPDATE,
        createdAt: { gte: start, lt: end },
        status: { in: ['PENDING', 'SUCCESS'] }, // opcional: contá PENDING también
      },
      select: { id: true, createdAt: true },
    });
    return Boolean(found);
  }

  /** Lanza error si ya hubo un BALANCE_UPDATE este mes (global) */
  async assertBalanceUpdateNotRunThisMonth(now = new Date()) {
    const exists = await this.hasBalanceUpdateThisMonth(now);
    if (exists) {
      throw new BadRequestException(
        'La actualización de balances ya se ejecutó este mes.',
      );
    }
  }

  /** Flujo completo de “Actualizar balances” (ejemplo de uso del servicio) */
  async runMonthlyBalanceUpdate(
    actorUserId: string,
    opts?: { requestId?: string; metadata?: Prisma.JsonValue },
  ) {
    // 1) Validación lógica previa (la BD puede tener además un índice único parcial)
    await this.assertBalanceUpdateNotRunThisMonth();

    // 2) Registrar inicio
    const log = await this.start(ActionType.BALANCE_UPDATE, actorUserId, {
      requestId: opts?.requestId ?? null,
      metadata: opts?.metadata ?? null,
      message: 'Inicio de actualización mensual de balances',
    });

    try {
      // 3) Ejecutar tu lógica principal aquí...
      //    - Recalcular balances por familia
      //    - Considerar cantidad de integrantes, cuota custom, etc.
      //    - Guardar resultados

      // Ejemplo de enriquecimiento de metadata:
      const finishedMetadata: Prisma.JsonValue = {
        ...(log.metadata as any),
        totals: { familiesProcessed: 123, changed: 95 },
      };

      // 4) Cerrar SUCCESS
      await this.markSuccess(
        log.id,
        'Balances actualizados correctamente',
        finishedMetadata,
      );

      return { ok: true, logId: log.id };
    } catch (err) {
      // 5) Cerrar ERROR
      await this.markError(log.id, err);
      throw err;
    }
  }
}

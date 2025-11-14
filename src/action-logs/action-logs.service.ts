// src/action-logs/action-logs.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ActionType, ActionTargetTable } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateLogInput, ListLogsParams } from './types';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { LoggedUser } from 'src/auth/types';
import { isLoggedUser } from 'src/auth/typeguards';

@Injectable()
export class ActionLogsService {
  private readonly logger = new Logger(ActionLogsService.name);
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

  /** Resolve actor from either an Express Request or the literal 'SYSTEM'.
   * Note: callers should pass either an Express Request (HTTP flow) or the string 'SYSTEM'
   * for programmatic/cron/manual flows. The method will return an object with
   * { actorId, loggedUser } where actorId is either the user id or the string 'SYSTEM'.
   */
  /**
   * Resolve actor from either an Express Request or the literal 'SYSTEM'.
   * This enforces the rule that callers should not pass arbitrary user-id strings
   * through the reqOrActor param. For programmatic flows that need a string
   * actor id (eg. jobs that run as a specific user) they should call ActionLogsService.start
   * directly with that user id. For automatic resolution pass the HTTP Request.
   */
  async resolveActor(reqOrActor?: ExpressRequest | LoggedUser | 'SYSTEM') {
    if (!reqOrActor) {
      throw new BadRequestException(
        'resolveActor requires an Express Request, a LoggedUser, or the literal "SYSTEM" as parameter.',
      );
    }

    // explicit SYSTEM actor
    if (typeof reqOrActor === 'string') {
      if (reqOrActor.toUpperCase() === 'SYSTEM') return { actorId: 'SYSTEM', loggedUser: undefined };
      throw new BadRequestException(
        "Invalid actor string passed to resolveActor(). Only the literal 'SYSTEM' is accepted when passing a string.",
      );
    }

    // If a LoggedUser object was provided directly, use it
    if (isLoggedUser(reqOrActor)) {
      return { actorId: reqOrActor.id, loggedUser: reqOrActor };
    }

    // Otherwise assume it's an Express Request: prefer req.user if populated by AuthGuard
    const req = reqOrActor as ExpressRequest & { user?: LoggedUser };
    if (req.user) {
      return { actorId: req.user.id, loggedUser: req.user };
    }

    // Do NOT attempt to decode tokens here anymore. AuthGuard is responsible
    // for populating `req.user`. If req.user is missing, fail fast and ask
    // the caller to ensure the request passed was authenticated / processed
    // by the AuthGuard. This enforces single responsibility and avoids
    // double-decoding tokens.
    throw new BadRequestException(
      'Unable to resolve actor: provided Request does not have req.user. Ensure AuthGuard populated req.user or pass a LoggedUser / "SYSTEM".',
    );
  }

  /** Crear un log genérico (sin idempotencia) */
  async create(input: CreateLogInput, reqOrActor: ExpressRequest | LoggedUser | 'SYSTEM') {
    // Resolve actor centrally using resolveActor (requires Request or 'SYSTEM')
    const resolved = await this.resolveActor(reqOrActor);
    const id_user = resolved.actorId;
    if (!id_user) {
      throw new BadRequestException('Unable to determine actor id for ActionLog after resolution.');
    }

    return this.prisma.actionLog.create({
      data: {
        action_type: input.action_type,
        id_user,
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
  async createIfAbsentByRequestId(input: CreateLogInput, reqOrActor: ExpressRequest | LoggedUser | 'SYSTEM') {
    if (!input.requestId) {
      // si no llega requestId, delega en create
      return this.create(input, reqOrActor);
    }
    const existing = await this.prisma.actionLog.findUnique({
      where: { requestId: input.requestId },
    });
    if (existing) return existing;
    return this.create(input, reqOrActor);
  }

  /** Inicia un log estilo “job” como PENDING */
  /**
   * Inicia un log estilo “job” como PENDING.
   *
   * Soporta dos modos:
   *  - start(action, explicitUserId, extra) -> crea el log con id_user igual a explicitUserId
   *  - start(action, reqOrActor, extra) -> si se pasa una Request o 'SYSTEM', delega a create
   *
   * Nota: Internamente la resolución del actor (desde request) se realiza en create()/resolveActor().
   */
  async start(
    action: ActionType,
    reqOrActor: ExpressRequest | LoggedUser | 'SYSTEM',
    extra?: Omit<CreateLogInput, 'action_type' | 'id_user' | 'status'>,
  ) {
    // Resolve actor and create a PENDING log, returning both log and loggedUser.
    const resolved = await this.resolveActor(reqOrActor);
    const actorId = resolved.actorId;
    const loggedUser = resolved.loggedUser;
    if (!actorId) {
      throw new BadRequestException('Unable to determine actor id for ActionLog after resolution.');
    }

    const log = await this.prisma.actionLog.create({
      data: {
        action_type: action,
        id_user: actorId,
        status: 'PENDING',
        target_table: extra?.target_table ?? null,
        target_id: extra?.target_id ?? null,
        id_family: extra?.id_family ?? null,
        id_transaction: extra?.id_transaction ?? null,
        message: extra?.message ?? null,
        requestId: extra?.requestId ?? null,
        ip: extra?.ip ?? null,
        userAgent: extra?.userAgent ?? null,
        metadata: extra?.metadata ?? undefined,
      },
    });

    return { log, loggedUser };
  }

  /**
   * Start an action log and also return the resolved loggedUser (when applicable).
   * This is a convenience wrapper used by services that both need a pending log
   * and the decoded user payload. It centralizes token decoding and avoids
   * letting services call getDataFromToken themselves.
   */
  async startWithActor(
    action: ActionType,
    reqOrActor: ExpressRequest | LoggedUser | 'SYSTEM',
    extra?: Omit<CreateLogInput, 'action_type' | 'id_user' | 'status'>,
  ) {
    // Deprecated: delegate to start
    return this.start(action, reqOrActor, extra);
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
    reqOrActor: ExpressRequest | 'SYSTEM',
    opts?: { requestId?: string; metadata?: Prisma.JsonValue },
  ) {
    // 1) Validación lógica previa (la BD puede tener además un índice único parcial)
    await this.assertBalanceUpdateNotRunThisMonth();

    // 2) Registrar inicio
    const { log } = await this.start(ActionType.BALANCE_UPDATE, reqOrActor, {
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

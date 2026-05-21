import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { LoggedUser } from 'src/auth/types';

export interface HealthAlert {
  id: string;
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  entity: string;
  count: number;
  description: string;
  affectedIds: string[];
}

@Injectable()
export class MonitoringService {
  constructor(private prisma: PrismaService) {}

  async getHealthCheck(user: LoggedUser): Promise<HealthAlert[]> {
    const ramaId = user.role === 'DIRIGENTE' ? user.id_rama : null;

    const beneficiarioFilter = {
      role: 'BENEFICIARIO' as const,
      ...(ramaId && { id_rama: ramaId }),
    };

    const userBaseFilter = ramaId ? { id_rama: ramaId } : {};

    // Pre-fetch family IDs in scope for DIRIGENTE
    const familyIdsInScope = ramaId
      ? (
          await this.prisma.family.findMany({
            where: { users: { some: { id_rama: ramaId } } },
            select: { id: true },
          })
        ).map((f) => f.id)
      : undefined;

    const familyScopeFilter = familyIdsInScope
      ? { id: { in: familyIdsInScope } }
      : {};

    const [
      c1Users,
      c2Users,
      c3Users,
      c5Families,
      c7ActiveHistories,
      a1Users,
      a2Users,
      a3Users,
      a6Users,
      m1Users,
      m2Users,
      m3Users,
      m4Users,
      m5Users,
      familiesWithDetails,
      m7Users,
    ] = await Promise.all([
      // C1: BENEFICIARIO sin familia
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, id_family: null },
        select: { id: true },
      }),
      // C2: BENEFICIARIO sin rama (MASTER only)
      ramaId
        ? Promise.resolve([] as { id: string }[])
        : this.prisma.user.findMany({
            where: { role: 'BENEFICIARIO', id_rama: null },
            select: { id: true },
          }),
      // C3: BENEFICIARIO sin familia ni rama (MASTER only)
      ramaId
        ? Promise.resolve([] as { id: string }[])
        : this.prisma.user.findMany({
            where: { role: 'BENEFICIARIO', id_family: null, id_rama: null },
            select: { id: true },
          }),
      // C5: Familias sin usuario con role FAMILY
      this.prisma.family.findMany({
        where: {
          ...familyScopeFilter,
          users: { none: { role: 'FAMILY' } },
        },
        select: { id: true },
      }),
      // C7: Historial de ramas activo duplicado
      this.prisma.userRamaHistory.findMany({
        where: {
          fecha_egreso: null,
          ...(ramaId && { user: { id_rama: ramaId } }),
        },
        select: { id_user: true, id: true },
      }),
      // A1: Sin email (BENEFICIARIO y FAMILY)
      this.prisma.user.findMany({
        where: {
          role: { in: ['BENEFICIARIO', 'FAMILY'] },
          email: null,
          ...userBaseFilter,
        },
        select: { id: true },
      }),
      // A2: Sin teléfono (BENEFICIARIO y FAMILY)
      this.prisma.user.findMany({
        where: {
          role: { in: ['BENEFICIARIO', 'FAMILY'] },
          phone: null,
          ...userBaseFilter,
        },
        select: { id: true },
      }),
      // A3: Sin DNI
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, dni: null },
        select: { id: true },
      }),
      // A6: DIRIGENTE sin rama (MASTER only)
      ramaId
        ? Promise.resolve([] as { id: string }[])
        : this.prisma.user.findMany({
            where: { role: 'DIRIGENTE', id_rama: null },
            select: { id: true },
          }),
      // M1: Sin fecha de nacimiento
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, birthdate: null },
        select: { id: true },
      }),
      // M2: Sin género
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, gender: null },
        select: { id: true },
      }),
      // M3: Sin ciudadanía
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, citizenship: null },
        select: { id: true },
      }),
      // M4: Sin dirección
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, address: null },
        select: { id: true },
      }),
      // M5: Sin carpeta de documentos
      this.prisma.user.findMany({
        where: { ...beneficiarioFilter, id_folder: null },
        select: { id: true },
      }),
      // Familias con balance para A4, A5, M6
      this.prisma.family.findMany({
        where: familyScopeFilter,
        select: {
          id: true,
          phone: true,
          balance: {
            select: {
              is_custom_cuota: true,
              custom_cuota: true,
              is_custom_cfa: true,
              custom_cfa_value: true,
            },
          },
        },
      }),
      // M7: Para validación de edad vs rango de rama
      this.prisma.user.findMany({
        where: {
          ...beneficiarioFilter,
          birthdate: { not: null },
          id_rama: { not: null },
        },
        select: {
          id: true,
          birthdate: true,
          rama: { select: { edad_min: true, edad_max: true } },
        },
      }),
    ]);

    // Procesar C4: familias sin usuarios (solo MASTER)
    const c4Families = ramaId
      ? []
      : await this.prisma.family.findMany({
          where: { users: { none: {} } },
          select: { id: true },
        });

    // Procesar C7: usuarios con más de un historial activo
    const c7Map = new Map<string, number>();
    for (const h of c7ActiveHistories) {
      c7Map.set(h.id_user, (c7Map.get(h.id_user) ?? 0) + 1);
    }
    const c7UserIds = [...c7Map.entries()]
      .filter(([, count]) => count > 1)
      .map(([id]) => id);

    // Procesar alertas de familias con balance
    const a4Families = familiesWithDetails.filter(
      (f) => f.balance?.is_custom_cuota && f.balance.custom_cuota === 0,
    );
    const a5Families = familiesWithDetails.filter(
      (f) => f.balance?.is_custom_cfa && f.balance.custom_cfa_value === 0,
    );
    const m6Families = familiesWithDetails.filter((f) => !f.phone);

    // Procesar M7: edad fuera del rango de la rama
    const now = new Date();
    const m7Affected = m7Users.filter((u) => {
      if (!u.birthdate || !u.rama?.edad_min || !u.rama?.edad_max) return false;
      const age = now.getFullYear() - new Date(u.birthdate).getFullYear();
      return age < u.rama.edad_min || age > u.rama.edad_max;
    });

    // Construir arreglo de alertas
    const alerts: HealthAlert[] = [];

    const addAlert = (
      id: string,
      severity: HealthAlert['severity'],
      entity: string,
      description: string,
      affected: { id: string }[] | string[],
    ) => {
      const ids =
        affected.length === 0
          ? []
          : typeof affected[0] === 'string'
            ? (affected as string[])
            : (affected as { id: string }[]).map((a) => a.id);
      if (ids.length > 0) {
        alerts.push({ id, severity, entity, count: ids.length, description, affectedIds: ids });
      }
    };

    // CRÍTICAS
    addAlert('C1', 'CRITICA', 'User', 'Beneficiarios sin familia asignada', c1Users);
    addAlert('C2', 'CRITICA', 'User', 'Beneficiarios sin rama asignada', c2Users);
    addAlert('C3', 'CRITICA', 'User', 'Beneficiarios sin familia ni rama', c3Users);
    addAlert('C4', 'CRITICA', 'Family', 'Familias sin ningún miembro', c4Families);
    addAlert('C5', 'CRITICA', 'Family', 'Familias sin usuario administrador', c5Families);
    addAlert('C7', 'CRITICA', 'UserRamaHistory', 'Usuarios con múltiples ramas activas simultáneas', c7UserIds);

    // ALTAS
    addAlert('A1', 'ALTA', 'User', 'Usuarios sin email registrado', a1Users);
    addAlert('A2', 'ALTA', 'User', 'Usuarios sin teléfono registrado', a2Users);
    addAlert('A3', 'ALTA', 'User', 'Beneficiarios sin DNI registrado', a3Users);
    addAlert('A4', 'ALTA', 'Balance', 'Familias con cuota personalizada activa en cero', a4Families);
    addAlert('A5', 'ALTA', 'Balance', 'Familias con CFA personalizado activo en cero', a5Families);
    addAlert('A6', 'ALTA', 'User', 'Dirigentes sin rama asignada', a6Users);

    // MEDIAS
    addAlert('M1', 'MEDIA', 'User', 'Beneficiarios sin fecha de nacimiento', m1Users);
    addAlert('M2', 'MEDIA', 'User', 'Beneficiarios sin género registrado', m2Users);
    addAlert('M3', 'MEDIA', 'User', 'Beneficiarios sin ciudadanía registrada', m3Users);
    addAlert('M4', 'MEDIA', 'User', 'Beneficiarios sin dirección registrada', m4Users);
    addAlert('M5', 'MEDIA', 'User', 'Beneficiarios sin carpeta de documentos', m5Users);
    addAlert('M6', 'MEDIA', 'Family', 'Familias sin teléfono de contacto', m6Families);
    addAlert('M7', 'MEDIA', 'User', 'Beneficiarios cuya edad no corresponde al rango de su rama', m7Affected);

    return alerts;
  }
}

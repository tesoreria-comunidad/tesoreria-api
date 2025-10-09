import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DateTime } from 'luxon';
import { Balance, Family } from '@prisma/client';

@Injectable()
export class CobrabilidadService {
  private readonly logger = new Logger(CobrabilidadService.name);

  constructor(private prisma: PrismaService) {}

  async calcularCobrabilidadPorRama(mes: number, anio: number) {
    try {
      // --- 1️⃣ Obtener datos base ---
      const [ramas, cuotaActiva, cuotasPorHermanos, familias, transacciones] =
        await Promise.all([
          this.prisma.rama.findMany(),
          this.prisma.cuota.findFirst({ where: { is_active: true } }),
          this.prisma.cuotaPorHermanos.findMany(),
          this.prisma.family.findMany({
            include: { users: true, balance: true },
          }),
          this.prisma.transactions.findMany({
            where: {
              payment_date: {
                gte: DateTime.local(anio, mes).startOf('month').toJSDate(),
                lte: DateTime.local(anio, mes).endOf('month').toJSDate(),
              },
              category: 'CUOTA', // ✅ solo transacciones de tipo CUOTA
              direction: 'INCOME', // ✅ solo ingresos
            },
            include: { family: true },
          }),
        ]);

      const valorCuotaBase = cuotaActiva?.value ?? 0;

      // --- 2️⃣ Determinar monto esperado por familia ---
      const calcularCuotaEsperada = async (family): Promise<number> => {
        const balance = await this.prisma.balance.findFirst({
          where: {
            id: family.id_balance,
          },
        });
        const beneficiariosActivos = family.users.filter(
          (u) => u.is_active && !u.is_granted,
        ).length;

        if (beneficiariosActivos === 0) return 0;
        if (!balance) return 0;

        // Si tiene cuota personalizada, se usa
        if (balance?.is_custom_cuota) {
          return family.balance.custom_cuota ?? 0;
        }

        // Buscar valor por cantidad de hermanos
        const especial = cuotasPorHermanos.find(
          (c) => c.cantidad === beneficiariosActivos,
        );
        const valor = especial ? especial.valor : valorCuotaBase;

        if (
          balance?.previousValue &&
          balance?.previousValue < 0 &&
          Math.abs(balance.previousValue) >= valor
        ) {
          return Math.abs(balance.previousValue) + valor;
        }
        return valor;
      };

      // --- 3️⃣ Total esperado por rama ---
      const totalEsperadoPorRama: Record<string, number> = {};
      for (const family of familias) {
        if (!family.manage_by) continue;
        const monto = await calcularCuotaEsperada(family);
        totalEsperadoPorRama[family.manage_by] =
          (totalEsperadoPorRama[family.manage_by] ?? 0) + monto;
      }

      // --- 4️⃣ Total cobrado por rama (según transacciones) ---
      const totalCobradoPorRama: Record<string, number> = {};
      for (const tx of transacciones) {
        const ramaId = tx.family?.manage_by;
        if (!ramaId) continue;
        totalCobradoPorRama[ramaId] =
          (totalCobradoPorRama[ramaId] ?? 0) + tx.amount;
      }

      // --- 5️⃣ Resultado final ---
      const resultados = ramas.map((rama) => {
        const totalEsperado = totalEsperadoPorRama[rama.id] ?? 0;
        const totalCobrado = totalCobradoPorRama[rama.id] ?? 0;
        const cobrabilidad =
          totalEsperado > 0 ? (totalCobrado / totalEsperado) * 100 : 0;

        return {
          id_rama: rama.id,
          rama: rama.name,
          totalEsperado: Number(totalEsperado.toFixed(2)),
          totalCobrado: Number(totalCobrado.toFixed(2)),
          cobrabilidad: Number(cobrabilidad.toFixed(2)),
        };
      });

      this.logger.log(
        `✅ Cobrabilidad calculada correctamente para ${resultados.length} ramas (${mes}/${anio})`,
      );

      return resultados;
    } catch (error) {
      this.logger.error('❌ Error al calcular cobrabilidad', error);
      throw new InternalServerErrorException(
        'Error al calcular la cobrabilidad por rama',
      );
    }
  }
}

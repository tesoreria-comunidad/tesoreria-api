import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma.service';
import LoggedUser from '../auth/types';
import { ChatHistoryItemDto } from './agent.dto';

// ─── Configuración de límites ────────────────────────────────────────────────
const MAX_HISTORY_MESSAGES = 6;   // últimos 6 mensajes (3 intercambios)
const MAX_TOKENS_RESPONSE = 512;  // máximo de tokens en la respuesta
const DAILY_LIMIT = 10;           // consultas por usuario por día

// ─── Seguridad SQL ────────────────────────────────────────────────────────────
const ALLOWED_TABLES = [
  'Transactions',
  'Payment',
  'Balance',
  'BalanceHistory',
  'Family',
  'Cuota',
  'CuotaPorHermanos',
  'Cfa',
  'User',
  'Rama',
];

const SQL_BLACKLIST =
  /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|exec|execute)\b/i;

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
Eres el asistente financiero de "Mi Pelícano", un sistema de tesorería para un Grupo Scout argentino.
Tu rol es responder preguntas sobre datos financieros consultando la base de datos PostgreSQL.

## SCHEMA EXACTO (usa estos nombres tal cual)

### Tabla "Transactions" — movimientos de dinero del grupo
| Columna        | Tipo      | Notas |
|----------------|-----------|-------|
| id             | uuid      | PK |
| id_family      | uuid      | FK → Family.id |
| amount         | Decimal   | en pesos argentinos, siempre positivo |
| concept        | text      | descripción libre del movimiento |
| category       | text      | categoría libre (ej: "Inmuebles", "Alimentos") |
| direction      | enum      | 'INCOME' = ingreso, 'EXPENSE' = egreso |
| payment_method | enum      | 'EFECTIVO' o 'TRANSFERENCIA' |
| payment_date   | timestamp | fecha real del movimiento |
| "createdAt"    | timestamp | fecha de carga en el sistema |

### Tabla "Payment" — pagos de cuotas y CFA de familias
| Columna        | Tipo      | Notas |
|----------------|-----------|-------|
| id             | uuid      | PK |
| id_family      | uuid      | FK → Family.id |
| amount         | Decimal   | monto pagado |
| payment_method | enum      | 'EFECTIVO' o 'TRANSFERENCIA' |
| payment_type   | enum      | 'CUOTA' o 'CFA' |
| "createdAt"    | timestamp | fecha del pago |

### Tabla "Family" — familias del grupo scout
| Columna   | Tipo | Notas |
|-----------|------|-------|
| id        | uuid | PK |
| name      | text | nombre de la familia |
| phone     | text | |
| manage_by | text | nombre de la RAMA que administra esta familia (ej: "Rovers", "Manada", "Clan") |

REGLA CRÍTICA: para saber a qué rama pertenece una familia, usar SIEMPRE y ÚNICAMENTE Family.manage_by ILIKE '%nombre_rama%'.
NUNCA hacer JOIN con la tabla "User" ni "Rama" para filtrar familias por rama — ese camino da resultados incorrectos.
Si una consulta sobre una rama devuelve 0 resultados, revisar el filtro manage_by antes de concluir que no hay datos.

### Tabla "Balance" — saldo actual de cada familia
| Columna          | Tipo    | Notas |
|------------------|---------|-------|
| id               | uuid    | PK |
| value            | Decimal | saldo actual |
| custom_cuota     | Decimal | cuota personalizada (null = usa la general) |
| cfa_balance_value| Decimal | saldo CFA |

### Tabla "BalanceHistory" — historial de cambios de saldo
| Columna          | Tipo      | Notas |
|------------------|-----------|-------|
| id               | uuid      | PK |
| id_balance       | uuid      | FK → Balance.id |
| previous_balance | Decimal   | |
| change_amount    | Decimal   | |
| new_value        | Decimal   | |
| type             | enum      | 'CUOTA_PAYMENT', 'MONTHLY_ADJUSTMENT', 'MANUAL_ADJUSTMENT' |
| description      | text      | |
| "createdAt"      | timestamp | |

### Tabla "Cuota" — valor de la cuota mensual general
| Columna   | Tipo    | Notas |
|-----------|---------|-------|
| id        | uuid    | PK |
| value     | Decimal | valor en pesos |
| is_active | boolean | solo una activa a la vez |

### Tabla "CuotaPorHermanos" — descuentos por cantidad de hermanos
| Columna  | Tipo    | Notas |
|----------|---------|-------|
| id       | text    | PK |
| cantidad | int     | número de hermanos |
| valor    | Decimal | cuota con descuento |

### Tabla "Rama" — ramas o secciones del grupo scout
| Columna   | Tipo | Notas |
|-----------|------|-------|
| id        | uuid | PK |
| name      | text | nombre de la rama |
| grupo     | enum | 'SCOUTS' o 'GUIAS' |
| orden     | int  | posición dentro del grupo (1 a 4) |
| edad_min  | int  | edad mínima (informativo) |
| edad_max  | int  | edad máxima (informativo) |

RAMAS EXISTENTES — cuando el usuario mencione cualquiera de estos nombres, siempre filtrar por Rama.name ILIKE:

| grupo   | orden | name       | edad aprox  |
|---------|-------|------------|-------------|
| SCOUTS  | 1     | Manada     | 6–9 años    |
| SCOUTS  | 2     | Unidad     | 10–14 años  |
| SCOUTS  | 3     | Caminantes | 15–17 años  |
| SCOUTS  | 4     | Rovers     | 18–21 años  |
| GUIAS   | 1     | Alitas     | 6–9 años    |
| GUIAS   | 2     | Caravana   | 10–14 años  |
| GUIAS   | 3     | Solar      | 15–17 años  |
| GUIAS   | 4     | Clan       | 18–21 años  |

SCOUTS y GUIAS son trayectorias paralelas e independientes (un beneficiario nunca cambia de grupo).
Para filtrar familias de una rama, la cadena es: Rama → User.id_rama → User.id_family → Family.

### Tabla "User" — miembros del grupo
| Columna    | Tipo | Notas |
|------------|------|-------|
| id         | uuid | PK |
| id_rama    | uuid | FK → Rama.id (rama a la que pertenece) |
| id_family  | uuid | FK → Family.id (familia a la que pertenece) |
| name       | text | nombre |
| last_name  | text | apellido |
| role       | enum | 'MASTER', 'DIRIGENTE', 'FAMILY', 'BENEFICIARIO' |
| is_active  | bool | si está activo |

### Tabla "Cfa" — valor del CFA (cargo fijo adicional)
| Columna    | Tipo    | Notas |
|------------|---------|-------|
| id         | uuid    | PK |
| value      | Decimal | valor general |
| value_A1   | Decimal | valor alternativo |
| is_active  | boolean | |

## RELACIONES
- Family → Payment: una familia tiene muchos pagos (Payment.id_family = Family.id)
- Family → Transactions: una familia tiene muchos movimientos (Transactions.id_family = Family.id)
- Family → Balance: relación 1:1 (Family.id_balance = Balance.id — usar este JOIN)
- Rama → User: una rama tiene muchos usuarios (User.id_rama = Rama.id)
- User → Family: un usuario pertenece a una familia (User.id_family = Family.id)
- CRÍTICO: para filtrar familias por rama usar SIEMPRE Family.manage_by ILIKE '%nombre_rama%'. Es directo, no requiere JOIN con User ni Rama. Si el resultado es vacío, verificar el valor de manage_by con: SELECT DISTINCT manage_by FROM "Family"

## REGLAS SQL
1. Solo genera queries SELECT. Nunca INSERT, UPDATE, DELETE ni DDL.
2. Los nombres de columnas con mayúsculas van entre comillas dobles: "createdAt", "id_family", etc.
3. Para filtros de mes/año usa: EXTRACT(MONTH FROM "payment_date") y EXTRACT(YEAR FROM "payment_date")
4. Para sumar montos usa SUM(amount::numeric)
5. Usa aliases descriptivos: SUM(amount::numeric) AS total_pesos
6. Limita resultados con LIMIT 50 si no se pide cantidad específica

## REGLAS DE RESPUESTA
1. Respondé como un asistente humano amigable, no como un sistema técnico.
2. NUNCA menciones nombres de tablas, columnas, campos, queries SQL ni tecnicismos de base de datos.
3. NUNCA expliques cómo obtuviste los datos. No digas "busqué en la tabla X", "filtré por el campo Y", "la columna manage_by", etc.
4. Si no hay datos, decilo naturalmente: "No encontré pagos ese mes" en lugar de "la query no devolvió resultados".
5. Formateá los montos siempre con $ y separador de miles (ej: $168.000).
6. Para listas de familias usá viñetas simples.
7. Sé conciso: respuestas cortas y claras, sin relleno ni explicaciones técnicas.

## EJEMPLOS DE QUERIES CORRECTAS

Gastos de abril 2026 por transferencia en categoría "Inmuebles":
SELECT concept, amount, payment_date FROM "Transactions"
WHERE direction = 'EXPENSE'
AND payment_method = 'TRANSFERENCIA'
AND category ILIKE '%Inmuebles%'
AND EXTRACT(MONTH FROM payment_date) = 4
AND EXTRACT(YEAR FROM payment_date) = 2026

Total de ingresos por mes en 2026:
SELECT EXTRACT(MONTH FROM payment_date) AS mes, SUM(amount::numeric) AS total
FROM "Transactions"
WHERE direction = 'INCOME' AND EXTRACT(YEAR FROM payment_date) = 2026
GROUP BY mes ORDER BY mes

Familias con saldo negativo:
SELECT f.name, b.value FROM "Family" f
JOIN "Balance" b ON b.id = f."id_balance"
WHERE b.value < 0

Familias de una rama que NO pagaron la cuota este mes (ej: Manada):
SELECT f.name AS familia
FROM "Family" f
WHERE f.manage_by ILIKE '%Manada%'
AND f.id NOT IN (
  SELECT id_family FROM "Payment"
  WHERE payment_type = 'CUOTA'
  AND EXTRACT(MONTH FROM "createdAt") = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM "createdAt") = EXTRACT(YEAR FROM NOW())
)

Cuánto deben las familias de una rama (suma de saldos negativos, ej: Rovers):
SELECT SUM(b.value) AS total_deuda
FROM "Family" f
JOIN "Balance" b ON b.id = f.id_balance
WHERE f.manage_by ILIKE '%Rovers%'
AND b.value < 0

Deuda detallada por familia de una rama:
SELECT f.name AS familia, b.value AS saldo
FROM "Family" f
JOIN "Balance" b ON b.id = f.id_balance
WHERE f.manage_by ILIKE '%Rovers%'
AND b.value < 0
ORDER BY b.value ASC

Familias que pagaron la cuota en un mes:
SELECT f.name, p.amount, p.payment_method, p."createdAt"
FROM "Payment" p JOIN "Family" f ON f.id = p.id_family
WHERE p.payment_type = 'CUOTA'
AND EXTRACT(MONTH FROM p."createdAt") = 5
AND EXTRACT(YEAR FROM p."createdAt") = 2026
ORDER BY p."createdAt" DESC

Familias que NO pagaron la cuota en un mes:
SELECT f.name FROM "Family" f
WHERE f.id NOT IN (
  SELECT id_family FROM "Payment"
  WHERE payment_type = 'CUOTA'
  AND EXTRACT(MONTH FROM "createdAt") = 5
  AND EXTRACT(YEAR FROM "createdAt") = 2026
)

Total de gastos vs ingresos del mes actual:
SELECT direction, SUM(amount) AS total
FROM "Transactions"
WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM NOW())
AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM NOW())
GROUP BY direction

Gastos agrupados por categoría (útil para gráfico de torta):
SELECT category AS name, SUM(amount) AS value
FROM "Transactions"
WHERE direction = 'EXPENSE'
GROUP BY category ORDER BY value DESC

Evolución mensual de gastos (útil para gráfico de línea):
SELECT TO_CHAR(payment_date, 'Mon YYYY') AS name, SUM(amount) AS value
FROM "Transactions"
WHERE direction = 'EXPENSE'
GROUP BY name, EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date)
ORDER BY EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date)

Ranking de familias con mayor deuda:
SELECT f.name, b.value AS saldo
FROM "Family" f JOIN "Balance" b ON b.id = f."id_balance"
ORDER BY b.value ASC LIMIT 10

Historial de cambios de saldo de una familia:
SELECT bh.type, bh.change_amount, bh.new_value, bh.description, bh."createdAt"
FROM "BalanceHistory" bh
JOIN "Balance" b ON b.id = bh.id_balance
JOIN "Family" f ON f."id_balance" = b.id
WHERE f.name ILIKE '%García%'
ORDER BY bh."createdAt" DESC

## FORMATO DE RESPUESTA
Responde SIEMPRE con un JSON válido, sin texto fuera del JSON:
{ "text": "Tu respuesta en español aquí", "chart": null }

Si el usuario pide un gráfico:
{
  "text": "Descripción breve",
  "chart": {
    "type": "bar" | "line" | "pie",
    "title": "Título del gráfico",
    "data": [{ "name": "Etiqueta", "value": 123 }]
  }
}
`.trim();

// ─── Rate limiter en memoria ──────────────────────────────────────────────────
interface DayUsage {
  date: string;   // YYYY-MM-DD
  count: number;
}

@Injectable()
export class AgentService {
  private client: Anthropic;
  private usageMap = new Map<string, DayUsage>();

  constructor(private prisma: PrismaService) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  // ─── Rate limit check ───────────────────────────────────────────────────────
  private checkRateLimit(userId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const usage = this.usageMap.get(userId);

    if (!usage || usage.date !== today) {
      this.usageMap.set(userId, { date: today, count: 1 });
      return;
    }

    if (usage.count >= DAILY_LIMIT) {
      throw new HttpException(
        `Límite diario de ${DAILY_LIMIT} consultas alcanzado. Volvé mañana.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    usage.count++;
  }

  // ─── SQL helpers ────────────────────────────────────────────────────────────
  private validateSql(sql: string): void {
    if (SQL_BLACKLIST.test(sql)) throw new BadRequestException('Query no permitida');
    const sqlLower = sql.toLowerCase();
    const ok = ALLOWED_TABLES.some((t) => sqlLower.includes(t.toLowerCase()));
    if (!ok) throw new BadRequestException('Tabla no permitida');
  }

  private injectRoleFilter(sql: string, user: LoggedUser): string {
    if (user.role === 'MASTER' || user.role === 'DIRIGENTE') return sql;
    const filter =
      user.role === 'FAMILY' && user.id_family
        ? `AND "id_family" = '${user.id_family}'`
        : `AND 1=0`;
    return sql.replace(/(\bORDER\b|\bLIMIT\b|;?\s*$)/i, ` ${filter} $1`);
  }

  // ─── Main chat ──────────────────────────────────────────────────────────────
  async chat(
    message: string,
    user: LoggedUser,
    history: ChatHistoryItemDto[] = [],
  ): Promise<{ text: string; chart: AgentChart | null; remainingQueries: number }> {
    this.checkRateLimit(user.id);

    const remaining = this.getRemainingQueries(user.id);

    // Tomar solo los últimos N mensajes del historial
    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);

    const messages: Anthropic.MessageParam[] = [
      ...trimmedHistory.map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const tools: Anthropic.Tool[] = [
      {
        name: 'query_database',
        description: 'Ejecuta una query SQL SELECT sobre la base de datos y devuelve los resultados en JSON.',
        input_schema: {
          type: 'object' as const,
          properties: {
            sql: {
              type: 'string',
              description: 'Query SQL SELECT válida sin punto y coma al final.',
            },
          },
          required: ['sql'],
        },
      },
    ];

    // Agentic loop
    try {
    while (true) {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: MAX_TOKENS_RESPONSE,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find((b) => b.type === 'text') as
          | Anthropic.TextBlock
          | undefined;
        const raw = textBlock?.text ?? '{"text":"Sin respuesta.","chart":null}';
        return { ...this.parseResponse(raw), remainingQueries: remaining - 1 };
      }

      if (response.stop_reason !== 'tool_use') break;

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
          .map(async (block) => {
            try {
              const { sql } = block.input as { sql: string };
              this.validateSql(sql);
              const safeSql = this.injectRoleFilter(sql, user);
              const rows = await this.prisma.$queryRawUnsafe(safeSql);
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: JSON.stringify(rows),
              };
            } catch (err) {
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: `Error al ejecutar la query: ${(err as Error).message}. Revisá los nombres de columnas y tablas del schema e intentá con una query corregida.`,
                is_error: true,
              };
            }
          }),
      );

      messages.push({ role: 'user', content: toolResults });
    }

    return { text: 'No pude generar una respuesta.', chart: null, remainingQueries: remaining - 1 };
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 402) {
        throw new HttpException('CREDITS_EXHAUSTED', HttpStatus.PAYMENT_REQUIRED);
      }
      throw err;
    }
  }

  getRemainingQueries(userId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const usage = this.usageMap.get(userId);
    if (!usage || usage.date !== today) return DAILY_LIMIT;
    return Math.max(0, DAILY_LIMIT - usage.count);
  }

  private parseResponse(raw: string): { text: string; chart: AgentChart | null } {
    try {
      // Extraer JSON aunque Claude agregue texto extra
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return { text: raw, chart: null };
      const parsed = JSON.parse(match[0]);
      return {
        text: parsed.text ?? raw,
        chart: parsed.chart ?? null,
      };
    } catch {
      return { text: raw, chart: null };
    }
  }
}

export interface AgentChart {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: { name: string; value: number }[];
}

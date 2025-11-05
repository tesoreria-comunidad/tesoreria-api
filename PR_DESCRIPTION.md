# PR: feat(logging): centralize action logs and add PENDING → SUCCESS/ERROR lifecycle

## Resumen corto
- Centraliza la creación y gestión de logs de acciones en `ActionLogsService` y estandariza el ciclo de vida de cada acción: crear log en `PENDING`, luego marcar `SUCCESS` o `ERROR`.
- Controllers ahora pasan `actorId` (extraído de `req.user?.id`) a los services; services aceptan `actorId?: string`.
- Saneamiento de metadata para que sea JSON-serializable (p. ej. `Date` → ISO string).
- Correcciones de módulos y DI para exponer `ActionLogsService` sin errores (`ActionLogsModule`, `ServicesModule`, `PrismaModule`).
- Incluye un reporte detallado: `REPORTE_REFACTORIZACION_LOGS.md`.

---

## Motivación
- Evitar duplicación de lógica de auditoría por la base de código.
- Asegurar trazabilidad: cada operación importante queda registrada con actor, metadata y estado (PENDING → SUCCESS/ERROR).
- Facilitar rastreo de errores y auditoría histórica.
- Evitar problemas de instancias duplicadas y errores de inyección por declarar providers compartidos en múltiples módulos.

---

## Qué incluye esta PR
- Nuevo/central: `ActionLogsService` con métodos `start()`, `markSuccess()`, `markError()`.
- Controllers actualizados para extraer y pasar `actorId` (convenio: Option A).
- Services actualizados para aceptar `actorId?: string` y usar `ActionLogsService` para la lifecycle de logs.
- Sanitización de metadata antes de persistir.
- Ajustes en módulos (import/export/re-export) para resolver errores de DI.
- Sweep completo de controllers/services críticos para propagar el patrón.
- Documento `REPORTE_REFACTORIZACION_LOGS.md` con registro y pasos de verificación.

---

## Lista de cambios (agrupada y detallada)

### Core / logging
- `src/action-logs/action-logs.service.ts`  
  - Centraliza la lógica de auditoría. Métodos principales:
    - `start(actionType, actorId, options?)` — crea registro con status `PENDING`.
    - `markSuccess(logId, message?, metadata?)` — marca `SUCCESS` y opcionalmente actualiza metadata.
    - `markError(logId, error, metadata?)` — marca `ERROR` y guarda detalles del error.
  - Reglas: metadata enviada se normaliza a valores JSON-serializables.

- `src/action-logs/action-logs.module.ts`  
  - Ahora exporta `ActionLogsService` para consumo por otros módulos.

- `src/action-logs/action-logs.controller.ts`  
  - Endpoints de consulta/debug (sin cambios disruptivos).

### Módulos y DI
- `src/services/services.module.ts`  
  - Importa y re-exporta `ActionLogsModule`. Mantiene `RoleFilterService`.
- `src/prisma.module.ts`  
  - Se usa como single-source para `PrismaService` (evitar providers duplicados).
- Módulos actualizados para evitar declarar `PrismaService`/`RoleFilterService` como providers locales y, en su lugar, importar `PrismaModule`/`ServicesModule`:
  - `src/cobrabilidad/cobrabilidad.module.ts` (actualizado para importar `ServicesModule` y `PrismaModule`)
  - `src/cron-jobs/cron-jobs.module.ts` (importa `BalanceModule` y `PrismaModule`)
  - Otros módulos consumidores revisados en el sweep final.

### Controllers (ahora pasan `actorId`)
- `src/user/user.controller.ts`
- `src/person/person.controller.ts`
- `src/payments/payments.controller.ts`
- `src/family/family.controller.ts`
- `src/balance/balance.controller.ts`
- `src/rama/rama.controller.ts`
- `src/folder/folder.controller.ts`
- `src/cuota/cuota.controller.ts`
- `src/transactions/transactions.controller.ts`
- (Otros controllers menores actualizados durante el sweep)

> Nota: los controllers extraen `actorId` típicamente como `const actorId = req.user?.id` y lo pasan a las llamadas a service.

### Services (aceptan `actorId?: string` y usan ActionLogsService)
- `src/transactions/transactions.service.ts` — Patrón tomado como referencia; ahora crea log PENDING antes de procesos largos y marca SUCCESS/ERROR.
- `src/user/user.service.ts`
- `src/person/person.service.ts`
- `src/payments/payments.service.ts`
- `src/family/family.service.ts`
- `src/balance/balance.service.ts` — `updateAll()` ahora usa `ActionLogsService` (start + markSuccess/markError).
- `src/rama/rama.service.ts`
- `src/folder/folder.service.ts`
- `src/cuota/cuota.service.ts`
- `src/cuota-por-hermanos/cuota-por-hermanos.service.ts`
- (Otros servicios incluidos en el sweep final)

### Correcciones y limpieza
- Ajustes de firmas en múltiples métodos y actualizaciones de callers para mantener compatibilidad TypeScript.
- Sanitización de metadata (`Date` → ISO string) para evitar errores al guardar JSON en Prisma/Postgres.
- Evitar exportar providers que no pertenecen al módulo: re-exportar módulos completos (fixed UnknownExportException).

### Documentación
- `REPORTE_REFACTORIZACION_LOGS.md` — reporte completo con decisiones, archivos afectados y pasos de verificación.

---

## Archivos modificados (lista representativa — cambios exactos en commit)
Nota: la lista incluye los principales archivos editados durante el sweep. Para un listado exhaustivo usa `git diff --name-only cbc8d2b..HEAD` o revisa el commit `cbc8d2bd4850970ec3a88cb61a00fd90b8f693eb`.

- src/action-logs/action-logs.service.ts
- src/action-logs/action-logs.module.ts
- src/action-logs/action-logs.controller.ts
- src/services/services.module.ts
- src/prisma.module.ts
- src/cobrabilidad/cobrabilidad.module.ts
- src/cron-jobs/cron-jobs.module.ts
- src/transactions/transactions.service.ts
- src/transactions/transactions.controller.ts
- src/user/user.service.ts
- src/user/user.controller.ts
- src/person/person.service.ts
- src/person/person.controller.ts
- src/payments/payments.service.ts
- src/payments/payments.controller.ts
- src/family/family.service.ts
- src/family/family.controller.ts
- src/balance/balance.service.ts
- src/balance/balance.controller.ts
- src/rama/rama.service.ts
- src/rama/rama.controller.ts
- src/folder/folder.service.ts
- src/folder/folder.controller.ts
- src/cuota/cuota.service.ts
- src/cuota/cuota.controller.ts
- src/cuota-por-hermanos/cuota-por-hermanos.service.ts
- REPORTE_REFACTORIZACION_LOGS.md
- (varios otros archivos menores en `dto/`, `schema/` y tests adaptados)

Commit / branch principal:
- Branch: `logsRevamped`
- Commit: `cbc8d2bd4850970ec3a88cb61a00fd90b8f693eb`

---

## Cómo probar rápidamente (comandos PowerShell)

1. Levantar en modo dev:
```powershell
npm run start:dev
```

2. Disparar una acción que genere logs (ej.: endpoint de actualización mensual de balances):
- Llama al endpoint correspondiente o ejecuta la ruta desde Postman / curl.

3. Abrir Prisma Studio y verificar la tabla `ActionLog`:
```powershell
npx prisma studio
```
- Comprueba que:
  - Se crea un registro con `status = "PENDING"` al inicio.
  - Tras la finalización, el registro cambia a `status = "SUCCESS"` (o `ERROR` si falla).
  - `actor_id` está poblado.
  - `metadata` contiene sólo valores JSON-serializables.

4. Alternativa: consulta directa a la DB (ajusta conexión/tabla):
```sql
SELECT id, action_type, status, actor_id, metadata, created_at
FROM "ActionLog"
ORDER BY created_at DESC
LIMIT 20;
```

5. Ejecutar tests:
```powershell
npm test
```

---

## Riesgos / compatibilidad
- API pública: sin cambios en los endpoints públicos (requests/responses), por lo que debería ser compatible hacia atrás.
- Internamente cambiaron firmas de services (se añadió `actorId?: string`). Todos los callers fueron actualizados en el sweep; si hay módulos no cubiertos, puede aparecer un error de compilación — se recomienda ejecutar una build local.
- Pequeña sobrecarga: inserción + actualización por acción (coste aceptable vs beneficio de trazabilidad).

---

## Problemas resueltos durante la tarea
- `UnknownDependenciesException` para `ActionLogsService` → solución: exportar `ActionLogsService` desde `ActionLogsModule` y re-exportar desde `ServicesModule`; asegurar imports en consumidores.
- `UnknownExportException` al exportar providers que no forman parte del módulo → solución: re-exportar módulos completos.
- Eliminadas declaraciones repetidas de `PrismaService` en módulos consumidores; ahora se importa `PrismaModule`.

---

## Recomendaciones / próximos pasos
1. Añadir tests unitarios para `ActionLogsService`.
2. Añadir un e2e smoke test que verifique el lifecycle PENDING→SUCCESS/ERROR para una acción concreta.
3. (Opcional) Hacer `ActionLogsModule` `@Global()` si preferís no importarlo en cada módulo (trade-off: claridad vs conveniencia).
4. Hacer un sweep final para reemplazar cualquier uso residual de `PrismaService` o `RoleFilterService` como provider local por import de `PrismaModule` / `ServicesModule`.
5. Revisar la política de guardado de metadata (PII) y anonimizar datos si es necesario antes de guardar logs en producción.

---

## Descripción corta para PR title / summary
- Título sugerido: `feat(logging): centralize action logs and add PENDING → SUCCESS/ERROR lifecycle`
- Resumen (1–2 líneas): Centraliza la auditoría de acciones en `ActionLogsService`, propaga `actorId` desde controllers a services, y garantiza el lifecycle de logs (PENDING → SUCCESS/ERROR). Corrige problemas de DI y actualiza módulos y servicios afectados.

---

Si querés que además genere:
- La lista exhaustiva de todos los archivos modificados (salida `git diff --name-only`), o
- El cuerpo listo para pegar en la interfaz de GitHub con la lista completa de archivos y `CHANGELOG` reducido,

dímelo y lo añado. También puedo crear el PR en GitHub por ti (push + `gh pr create`) si autorizas.

# Cronjob de Actualización Mensual de Balances

## Descripción

Este módulo implementa un cronjob automatizado que se ejecuta el **primer día de cada mes a las 00:01** para actualizar los balances de todas las familias, restando el valor de la cuota correspondiente.

## Funcionalidad

### Proceso Automático
- **Frecuencia**: Se ejecuta automáticamente el día 1 de cada mes a las 00:01
- **Zona horaria**: Configurado para `America/Argentina/Buenos_Aires`
- **Acción**: Resta el valor de la cuota activa del balance de cada familia

### Lógica de Negocio
1. **Obtiene la cuota activa**: Busca la cuota marcada como `is_active: true`
2. **Procesa todas las familias**: Itera sobre todas las familias existentes
3. **Determina la cuota a aplicar**:
   - Si la familia tiene `is_custom_cuota: true`, usa `custom_cuota`
   - Si no, usa el valor de la cuota activa global
4. **Actualiza el balance**: Resta la cuota del balance actual
5. **Registra transacciones**: Crea un registro de transacción para cada familia

### Endpoints API

#### GET `/cron-jobs/status`
- **Descripción**: Obtiene el estado del cronjob
- **Permisos**: MASTER, DIRIGENTE
- **Respuesta**:
```json
{
  "status": {
    "isRunning": true,
    "nextRun": "2025-02-01T00:01:00.000Z"
  },
  "description": "Estado del cronjob de actualización mensual de balances"
}
```

#### POST `/cron-jobs/run-monthly-update`
- **Descripción**: Ejecuta manualmente la actualización mensual
- **Permisos**: MASTER, DIRIGENTE
- **Respuesta**:
```json
{
  "message": "Actualización mensual de balances ejecutada exitosamente",
  "timestamp": "2025-08-18T15:30:00.000Z"
}
```

#### POST `/cron-jobs/stop`
- **Descripción**: Detiene el cronjob automático
- **Permisos**: MASTER
- **Respuesta**:
```json
{
  "message": "Cronjob detenido exitosamente",
  "timestamp": "2025-08-18T15:30:00.000Z"
}
```

#### POST `/cron-jobs/start`
- **Descripción**: Inicia el cronjob automático
- **Permisos**: MASTER
- **Respuesta**:
```json
{
  "message": "Cronjob iniciado exitosamente",
  "timestamp": "2025-08-18T15:30:00.000Z"
}
```

## Configuración del Patrón Cron

El cronjob utiliza el siguiente patrón:
```
'0 1 0 1 * *'
```

**Formato**: `segundo minuto hora día mes día_semana`
- `0`: segundo 0
- `1`: minuto 1
- `0`: hora 0 (medianoche)
- `1`: día 1 del mes
- `*`: cualquier mes
- `*`: cualquier día de la semana

### Ajustar la Zona Horaria
Para cambiar la zona horaria, modifica el parámetro en `cron-jobs.service.ts`:
```typescript
this.monthlyBalanceUpdateJob = new CronJob(
  '0 1 0 1 * *',
  () => {
    this.updateFamilyBalancesForNewMonth();
  },
  null,
  true,
  'TU_ZONA_HORARIA' // Por ejemplo: 'America/Mexico_City'
);
```

## Logs

El servicio genera logs detallados:
- ✅ Inicio de la actualización mensual
- ℹ️ Cuota activa encontrada
- ✅ Balances actualizados exitosamente
- ⚠️ Advertencias si no hay cuota activa o familias
- ❌ Errores en caso de fallos

Ejemplo de log:
```
[CronJobsService] Iniciando actualización mensual de balances de familias
[CronJobsService] Cuota activa encontrada: $5000
[CronJobsService] Actualizando balances de 15 familias
[CronJobsService] Balance actualizado para familia García: $25000 -> $20000 (Cuota aplicada: $5000)
[CronJobsService] Actualización mensual completada. Éxitos: 15, Errores: 0
```

## Transacciones Generadas

Para cada familia, se crea automáticamente una transacción de tipo:
- **Categoría**: `CUOTA`
- **Dirección**: `EXPENSE`
- **Método de pago**: `EFECTIVO`
- **Concepto**: `CUOTA`
- **Descripción**: `"Cuota mensual aplicada automáticamente - [Mes] [Año]"`

## Consideraciones Importantes

1. **Cuotas Personalizadas**: El sistema respeta las cuotas personalizadas de cada familia
2. **Registro de Transacciones**: Cada deducción se registra como transacción para auditoría
3. **Manejo de Errores**: Si falla una familia, continúa con las demás
4. **Ejecución Manual**: Los administradores pueden ejecutar la actualización manualmente cuando sea necesario
5. **Control de Estado**: Los administradores pueden detener/iniciar el cronjob según sea necesario

## Instalación y Configuración

El cronjob se inicia automáticamente cuando se levanta la aplicación. No requiere configuración adicional, ya que:

1. ✅ La librería `cron` ya está instalada
2. ✅ El módulo `CronJobsModule` está incluido en `AppModule`
3. ✅ El servicio se inicializa automáticamente

## Testing

Para probar la funcionalidad:

1. **Verificar estado**: `GET /cron-jobs/status`
2. **Ejecutar manualmente**: `POST /cron-jobs/run-monthly-update`
3. **Verificar logs** en la consola de la aplicación
4. **Verificar balances** y transacciones en la base de datos

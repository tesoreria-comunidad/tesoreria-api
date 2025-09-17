¡Por supuesto! Aquí tienes un archivo Markdown explicando el uso del CRUD para la entidad **CuotaPorHermanos** y cómo se integra en la lógica de actualización de balances familiares.

---

# Configuración y Uso de Cuotas por Hermanos

## ¿Qué es CuotaPorHermanos?

La entidad **CuotaPorHermanos** permite definir el valor de la cuota mensual a descontar del balance de una familia según la cantidad de usuarios activos (hermanos) que tenga. Esta configuración es editable por Tesorería, sin necesidad de modificar el código fuente.

---

## Endpoints Disponibles

La API expone un CRUD completo para gestionar la configuración de cuotas por cantidad de hermanos.

### Crear una nueva configuración

```http
POST /cuota-por-hermanos
Content-Type: application/json

{
  "cantidad": 2,
  "valor": 8000
}
```
- **cantidad**: Número de usuarios activos (hermanos).
- **valor**: Valor de la cuota para esa cantidad.

---

### Listar todas las configuraciones

```http
GET /cuota-por-hermanos
```
**Respuesta:**
```json
[
  { "id": "uuid1", "cantidad": 1, "valor": 5000, ... },
  { "id": "uuid2", "cantidad": 2, "valor": 8000, ... }
]
```

---

### Obtener una configuración específica

```http
GET /cuota-por-hermanos/:id
```

---

### Actualizar el valor de una cuota

```http
PATCH /cuota-por-hermanos/:id
Content-Type: application/json

{
  "valor": 9000
}
```

---

### Eliminar una configuración

```http
DELETE /cuota-por-hermanos/:id
```

---

## ¿Cómo se usa en la lógica de balance?

Cuando se actualiza el balance de una familia, el sistema:

1. **Cuenta los usuarios activos** en la familia.
2. **Busca el valor de cuota** correspondiente en la tabla `CuotaPorHermanos` según la cantidad de usuarios activos.
3. **Aplica la fórmula**:
   ```
   montoADescontar = valorCuota * cantidadUsuariosActivos * 0.8
   ```
4. **Actualiza el balance** restando el monto calculado.

> Si no existe configuración para cierta cantidad, se puede usar un valor por defecto (ejemplo: 0).

**Ejemplo de código relevante:**  
[balance.service.ts](file:///C:/Users/Stefano/Repos/GitHub/tesoreria-api/src/balance/balance.service.ts)
```typescript
const cantidadActivos = family.users.filter(u => u.is_active).length;
let cuotaConfig = await this.prisma.cuotaPorHermanos.findFirst({
  where: { cantidad: cantidadActivos },
});
const valorCuota = cuotaConfig?.valor ?? 0;
const montoADescontar = valorCuota * cantidadActivos * 0.8;
```

---

## Ventajas de este enfoque

- **Editable por Tesorería**: No requiere cambios de código ni deploys.
- **Flexible**: Permite agregar, modificar o eliminar reglas para cualquier cantidad de hermanos.
- **Centralizado**: Toda la lógica de cálculo de cuotas depende de esta configuración.

---

## Consideraciones

- Si una familia tiene una cuota personalizada (`is_custom_cuota`), se ignora esta lógica y se usa el valor personalizado.
- Si no existe configuración para cierta cantidad de usuarios, se puede definir un valor por defecto o lanzar un error según la necesidad del negocio.

---

## Resumen

- Usa los endpoints REST para gestionar la configuración de cuotas por cantidad de hermanos.
- El sistema aplica automáticamente la fórmula al actualizar balances familiares.
- Tesorería puede modificar los valores en cualquier momento desde el frontend o herramientas administrativas.

---

¿Dudas o sugerencias? ¡No dudes en consultarnos!
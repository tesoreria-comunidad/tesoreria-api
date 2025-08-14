# Funcionalidad de Administrador de Familia

## Descripción
Se ha implementado la funcionalidad para crear usuarios administradores desde la entidad Family. Esto permite que cada familia tenga un usuario con rol de administrador que puede gestionar los datos de su familia.

## Cambios Realizados

### 1. Schema de Prisma
- Se agregó el campo `family_role` al modelo `User` con tipo enum `familyRole` (ADMIN | MEMBER)
- El valor por defecto es `ADMIN`

### 2. DTOs Actualizados

#### Family DTOs (`src/family/dto/family.dto.ts`)
- **CreateFamilyAdminUserDto**: Nuevo DTO para crear el usuario administrador
- **CreateFamilyDto**: Actualizado para incluir opcionalmente los datos del usuario administrador

#### User DTOs (`src/user/dto/user.dto.ts`)
- Agregado el campo `family_role` opcional en `CreateUserDTO` y `UpdateUserDTO`

### 3. Servicios Actualizados

#### FamilyService (`src/family/family.service.ts`)
- **create()**: Modificado para crear opcionalmente un usuario administrador
- **createFamilyAdminUser()**: Nuevo método privado para crear el usuario administrador

#### UserService (`src/user/user.service.ts`)
- **create()**: Actualizado para manejar `family_role`
- **getUsersByFamily()**: Nuevo método para obtener usuarios de una familia
- **getFamilyAdmin()**: Método para obtener un administrador de una familia
- **getFamilyAdmins()**: Nuevo método para obtener todos los administradores de una familia
- **promoteToFamilyAdmin()**: Nuevo método para promover un usuario a administrador
- **demoteFromFamilyAdmin()**: Nuevo método para degradar un administrador a miembro

### 4. Controladores Actualizados

#### UserController (`src/user/user.controller.ts`)
- **GET /user/family/:familyId**: Obtener todos los usuarios de una familia
- **GET /user/family/:familyId/admin**: Obtener el primer administrador de una familia
- **GET /user/family/:familyId/admins**: Obtener todos los administradores de una familia
- **PATCH /user/family/:familyId/promote/:userId**: Promover un usuario a administrador
- **PATCH /user/family/:familyId/demote/:userId**: Degradar un administrador a miembro

## Uso de la API

### Crear una familia con usuario administrador

```http
POST /family
Content-Type: application/json

{
  "name": "González",
  "phone": "+1234567890",
  "admin_user": {
    "username": "admin_gonzalez",
    "password": "SecurePass123!",
    "name": "Juan",
    "last_name": "González",
    "address": "Calle 123, Ciudad",
    "phone": "+1234567890",
    "email": "juan.gonzalez@email.com",
    "gender": "HOMBRE",
    "dni": "12345678",
    "birthdate": "1980-01-15T00:00:00.000Z",
    "citizenship": "Argentino",
    "role": "BENEFICIARIO"
  }
}
```

### Crear una familia sin usuario administrador

```http
POST /family
Content-Type: application/json

{
  "name": "Familia López",
  "phone": "+0987654321"
}
```

### Obtener usuarios de una familia

```http
GET /user/family/{familyId}
```

### Obtener administrador de una familia

```http
GET /user/family/{familyId}/admin
```

### Obtener todos los administradores de una familia

```http
GET /user/family/{familyId}/admins
```

### Promover un usuario a administrador

```http
PATCH /user/family/{familyId}/promote/{userId}
```

### Degradar un administrador a miembro

```http
PATCH /user/family/{familyId}/demote/{userId}
```

### Crear usuario regular de una familia

```http
POST /user
Content-Type: application/json

{
  "username": "member_gonzalez",
  "password": "SecurePass123!",
  "name": "María",
  "last_name": "González",
  "address": "Calle 123, Ciudad",
  "phone": "+1234567891",
  "email": "maria.gonzalez@email.com",
  "gender": "MUJER",
  "dni": "87654321",
  "birthdate": "1985-03-20T00:00:00.000Z",
  "citizenship": "Argentina",
  "role": "BENEFICIARIO",
  "family_role": "MEMBER",
  "id_family": "uuid-de-la-familia"
}
```

## Validaciones Implementadas

1. **Unicidad**: Username, email y DNI únicos en toda la base de datos
2. **Existencia**: Validación de que rama, carpeta y familia existan al asignarlos
3. **Roles familiares**: 
   - `ADMIN`: Usuario administrador de la familia (puede haber múltiples)
   - `MEMBER`: Usuario regular de la familia (por defecto)

## Consideraciones

- **Múltiples administradores**: Una familia puede tener uno o más usuarios con rol `ADMIN`
- El usuario administrador se crea automáticamente con `family_role = 'ADMIN'`
- Los usuarios regulares tienen `family_role = 'MEMBER'` por defecto
- **Protección**: No se puede degradar al último administrador de una familia
- **Promoción/Degradación**: Los usuarios existentes pueden ser promovidos o degradados
- La contraseña se hashea automáticamente antes de guardar en la base de datos
- Se mantiene la compatibilidad con la funcionalidad existente de usuarios

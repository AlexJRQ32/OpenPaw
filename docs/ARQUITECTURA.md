# Arquitectura de Alto Nivel - OpenPaw ???

## Diagrama de Arquitectura

```
+-----------------------------------------------------------------+
¦                     USUARIOS                                     ¦
¦     ?? Cliente    ?? Veterinaria    ?? Almacén    ?? Admin      ¦
+-----------------------------------------------------------------+
                           ¦ HTTPS
+--------------------------?--------------------------------------+
¦              FRONTEND: React + Vite (OpenPaw Web App)           ¦
¦  Login ¦ Dashboard ¦ Perfil ¦ Mascotas ¦ Expedientes            ¦
¦  Citas ¦ Comercios ¦ Productos ¦ Reportes                       ¦
+-----------------------------------------------------------------+
                           ¦ API REST (HTTPS)
+--------------------------?--------------------------------------+
¦         BACKEND: ASP.NET Core Web API (.NET 10)                  ¦
¦                                                                  ¦
¦  +----------------------------------------------------------+   ¦
¦  ¦              MÓDULOS FUNCIONALES                          ¦   ¦
¦  ¦  Auth ¦ Usuarios ¦ Mascotas ¦ Expedientes ¦ Citas         ¦   ¦
¦  ¦  Veterinarias ¦ Almacenes ¦ Productos ¦ Pedidos           ¦   ¦
¦  ¦  Notificaciones ¦ Compartir Expedientes                   ¦   ¦
¦  +----------------------------------------------------------+   ¦
¦                             ¦                                    ¦
¦  +--------------------------?-------------------------------+   ¦
¦  ¦              OpenPawDevs.Core                             ¦   ¦
¦  ¦  Entidades ¦ DTOs ¦ Interfaces ¦ Servicios ¦ Reglas       ¦   ¦
¦  +----------------------------------------------------------+   ¦
¦                             ¦                                    ¦
¦  +--------------------------?-------------------------------+   ¦
¦  ¦              OpenPawDevs.Data                             ¦   ¦
¦  ¦  EF Core ¦ DbContext ¦ Repositorios ¦ Migraciones        ¦   ¦
¦  +----------------------------------------------------------+   ¦
+-----------------------------------------------------------------+
                           ¦
+--------------------------?--------------------------------------+
¦              BASE DE DATOS: SQL Server (Somee)                   ¦
¦  Usuarios ¦ Roles ¦ Mascotas ¦ Expedientes ¦ Citas              ¦
¦  Veterinarias ¦ Almacenes ¦ Productos ¦ Inventario              ¦
¦  Pedidos ¦ Notificaciones                                       ¦
+-----------------------------------------------------------------+

+---------------------+          +-----------------------------+
¦    SEGURIDAD         ¦          ¦   SERVICIOS EXTERNOS        ¦
¦  ?? HTTPS            ¦          ¦   ?? Google OAuth            ¦
¦  ?? JWT Bearer       ¦          ¦   ?? Facebook OAuth          ¦
¦  ?? OAuth 2.0        ¦          ¦   ?? Correo/Notificaciones   ¦
¦  ?? Control de Roles ¦          ¦   ?? Almacenamiento Archivos ¦
¦  ?? Validación Datos ¦          ¦   ?? Logging y Monitoreo     ¦
¦  ?? Manejo Errores   ¦          ¦                              ¦
+---------------------+          +-----------------------------+
```

## Capas del Backend

### 1. OpenPawDevs.Core
- **Entidades:** 14 clases del dominio (Usuario, Mascota, Expediente, etc.)
- **Enums:** 7 enumeraciones (RolTipo, EstadoCita, SexoMascota, etc.)
- **DTOs:** 25 clases organizadas por módulo funcional
- **Interfaces:** 13 contratos de repositorio
- **Servicios:** AuthService (JWT + BCrypt + OAuth)

### 2. OpenPawDevs.Data
- **DbContext:** AppDbContext con 13 DbSets
- **Configuraciones:** 13 clases Fluent API
- **Repositorios:** GenericRepository + 12 específicos

### 3. OpenPawDevs.WebAPI
- **Controladores:** 11 REST controllers
- **Middleware:** ExceptionMiddleware global
- **Autenticación:** JWT Bearer con Swagger
- **CORS:** Configurado para React (localhost:5173)

## Roles del Sistema

| ID | Rol | Descripción |
|----|-----|-------------|
| 1 | Administrador | Control total del sistema |
| 2 | Veterinaria | Personal veterinario |
| 3 | Almacén | Personal de almacén |
| 4 | Cliente | Dueño de mascotas |

## Flujo de Autenticación

```
Frontend                          Backend                         Google/FB
   ¦                                ¦                                ¦
   +- Login (user/pass) -----------?¦                                ¦
   ¦                                +- Verificar BCrypt ----         ¦
   ¦?-------- JWT Token ------------¦                                ¦
   ¦                                ¦                                ¦
   +- Login con Google ------------?¦                                ¦
   ¦                                +- Verificar token ------------?¦
   ¦                                ¦?-- Email / Name --------------¦
   ¦                                +- Crear/buscar usuario         ¦
   ¦?-------- JWT Token ------------¦                                ¦
   ¦                                ¦                                ¦
   +- Endpoint protegido ----------?¦                                ¦
   ¦  (Authorization: Bearer JWT)   +- Validar JWT ----             ¦
   ¦?--------- 200 OK --------------¦                                ¦
```

## Decisiones Técnicas

| Decisión | Opción Elegida | Motivo |
|----------|---------------|--------|
| ORM | Entity Framework Core | Integración nativa con .NET, migrations |
| Autenticación | JWT + BCrypt | Stateless, seguro, estándar industria |
| Base de Datos | SQL Server (Somee) | Requisito del proyecto, hosting gratuito |
| Patrón | Repository + Service | Separación de concerns, testeable |

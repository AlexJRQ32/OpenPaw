# Guía de Desarrollo ?????

## Prerrequisitos

- .NET 10 SDK
- Node.js 20+ + pnpm
- SQL Server (LocalDB para desarrollo, Somee para producción)
- Visual Studio 2022+ / VS Code

## Inicio Rápido

### Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project OpenPawDevs.WebAPI
```

La API estará disponible en:
- HTTP: `http://localhost:5198`
- HTTPS: `https://localhost:7278`
- Swagger: `http://localhost:5198/swagger`

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

El frontend estará en `http://localhost:5173`

## Estructura del Backend

```
backend/
+-- OpenPawDevs.slnx
+-- OpenPawDevs.Core/
¦   +-- Entities/           # Entidades del dominio (14)
¦   +-- Enums/              # Enumeraciones (7)
¦   +-- DTOs/               # Objetos de transferencia (25)
¦   ¦   +-- Auth/
¦   ¦   +-- Usuario/
¦   ¦   +-- Mascota/
¦   ¦   +-- Expediente/
¦   ¦   +-- Cita/
¦   ¦   +-- Veterinaria/
¦   ¦   +-- Producto/
¦   ¦   +-- Pedido/
¦   ¦   +-- Notificacion/
¦   +-- Interfaces/         # Contratos de repositorios (13)
¦   +-- Services/           # Lógica de negocio
¦       +-- Interfaces/
¦       +-- AuthService.cs
+-- OpenPawDevs.Data/
¦   +-- Data/               # AppDbContext
¦   +-- Configurations/     # Fluent API EF Core (13)
¦   +-- Repositories/       # Acceso a datos (12)
+-- OpenPawDevs.WebAPI/
    +-- Controllers/        # Controladores REST (11)
    +-- Middleware/          # ExceptionMiddleware
    +-- Program.cs           # DI, JWT, CORS, Swagger
    +-- appsettings.json     # Configuración
```

## Convenciones

### Código
- **Lenguaje:** C# con nullable reference types habilitado
- **Async:** Todos los métodos de repositorio y controladores son async
- **Nombrado:** PascalCase para clases/métodos, camelCase para parámetros
- **Comentarios:** XML comments con referencia al PBI/Epic

### Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
config: configuración
merge: fusión de ramas
```

### Base de Datos
- Scripts SQL en `database/`
- EF Core configurado con Fluent API
- Usar LocalDB para desarrollo, Somee para producción

## Configuración de Secretos

Los secretos (API keys, tokens) van en:
1. `appsettings.Development.json` (excluido por .gitignore)
2. Variables de entorno del sistema

NO modificar `appsettings.json` con credenciales reales.

## Endpoints Disponibles

Ver documento completo: [ENDPOINT_BACKEND.md](../frontend/ENDPOINT_BACKEND.md)

# OpenPaw Devs 🐾

Carnet de mascotas compartible — tipo EDUS de Costa Rica — para el curso **Desarrollo de Aplicaciones** (8.º cuatrimestre, Universidad Hispanoamericana).

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | ASP.NET Core Web API (C#) |
| **Frontend** | React + Vite |
| **Base de datos** | SQL Server |
| **DevOps** | Azure DevOps (Git + Boards) |

## Prerrequisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB, Developer, o Express)
- [Visual Studio 2022](https://visualstudio.microsoft.com/) (opcional) o VS Code

## Configuración Local

```bash
# Clonar el repositorio
git clone https://dev.azure.com/DesarrolloAplicacionesScrumTeam/OpenPaw%20Devs/_git/OpenPaw%20Devs
cd OpenPaw Devs

# Restaurar paquetes del backend
dotnet restore backend/OpenPawDevs.slnx

# Construir el backend
dotnet build backend/OpenPawDevs.slnx

# Instalar dependencias del frontend
cd frontend
pnpm install

# Iniciar desarrollo
npm run dev    # Frontend en http://localhost:5173
```

### Backend — `launchSettings.json` (Deuda #72)

`backend/OpenPawDevs.WebAPI/Properties/launchSettings.json` define el perfil **Development**:

```json
{
  "profiles": {
    "Development": {
      "commandName": "Project",
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" }
    }
  }
}
```

- `dotnet run` **sin** variable de entorno ya arranca en `Development` (lee `launchSettings.json`). Usa `appsettings.json` (`Server=localhost;Database=OpenPawDevs;Trusted_Connection=True…`) y **no** `appsettings.Production.json` (Somee `OpenPawDataBase.mssql.somee.com`). No hace falta `dotnet run --no-launch-profile`.
- En producción Somee/Azure la variable `ASPNETCORE_ENVIRONMENT=Production` la inyecta el hosting; `launchSettings.json` solo afecta a `dotnet run` local.

### Backend — Secrets via variables de entorno (Deuda #73)

`appsettings.json` y `appsettings.Production.json` **ya no contienen secrets en plaintext**. Contienen placeholders `REPLACE_WITH_ENV_VAR__*` y son sobrescribibles por env vars (ASP.NET Core mapea `__` a `:`).

**Variables obligatorias:**

| Env var | Mapea a | Descripción |
|---------|---------|-------------|
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings:DefaultConnection` | Cadena SQL Server (Somee/Azure en prod, `Trusted_Connection` en local) |
| `Jwt__Key` | `Jwt:Key` | Clave HMAC-SHA256, **min 32 chars**, rotar si estuvo en repo |
| `Jwt__Issuer` / `Jwt__Audience` | `Jwt:Issuer` / `Jwt:Audience` | Opcional (defaults `OpenPawDevs` / `OpenPawDevsApp`) |
| `Facebook__AppSecret` | `Facebook:AppSecret` | Secret de Facebook Login (AppId `2470437836755419` es público) |

**Configuración local (Development):**

```bash
# Opcion A: User Secrets (recomendado, no queda en disco plaintext)
dotnet user-secrets init --project backend/OpenPawDevs.WebAPI
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 32)" --project backend/OpenPawDevs.WebAPI
dotnet user-secrets set "Facebook:AppSecret" "tu_app_secret" --project backend/OpenPawDevs.WebAPI
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=OpenPawDevs;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true" --project backend/OpenPawDevs.WebAPI

# Opcion B: env vars temporales (PowerShell)
$env:Jwt__Key="tu_clave_32_chars_min_random"
$env:Facebook__AppSecret="tu_secret"
$env:ConnectionStrings__DefaultConnection="Server=localhost;Database=OpenPawDevs;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
dotnet run --project backend/OpenPawDevs.WebAPI

# Opcion C: copiar plantilla (solo para referencia, NO commitear .env)
copy backend\.env.example backend\OpenPawDevs.WebAPI\.env   # Windows — luego editar valores
```

Plantilla versionada: `backend/.env.example` y `backend/OpenPawDevs.WebAPI/.env.example` (placeholders, sin secrets reales).

**Producción (Somee / Azure / AlwaysData):** configurar las 3 env vars en el panel del hosting (`ConnectionStrings__DefaultConnection`, `Jwt__Key`, `Facebook__AppSecret`). Si `Jwt:Key` falta o sigue con placeholder, la API falla al arrancar con `InvalidOperationException` explícito (fail-fast). `Jwt:Key` debe rotarse tras haber estado en plaintext en el repo — generar nueva con `openssl rand -base64 32`.

**Verificación:** `dotnet build` sigue pasando (appsettings es JSON válido con placeholders). Grep en repo no debe hallar `d6168918`, `ji8r437i8f` ni `ChangeThis_32CharMin` — solo `REPLACE_WITH_ENV_VAR`.

### Frontend — `.env` local (Deuda #72)

- **Por defecto sin `.env`** el frontend apunta a `https://openpaw.alwaysdata.net/api` (fallback en `src/constants.js`: `import.meta.env.VITE_API_BASE_URL ?? 'https://openpaw.alwaysdata.net/api'`).
- Para desarrollo contra el backend local (`http://localhost:5000`):

```bash
cd frontend
copy .env.example .env.local        # Windows
# cp .env.example .env.local        # Linux/Mac
# o: copy .env.local.example .env.local
```

Contenido de `.env.example` / `.env.local.example`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

- `.env` y `.env.local` están en `.gitignore` (no se versionan); `.env.example` y `.env.local.example` **sí** se versionan como plantilla.
- En Vercel la URL de producción se inyecta vía variables del hosting, no hace falta `.env` en el repo.

## Estructura del Proyecto

```
OpenPaw Devs/
├── backend/
│   ├── OpenPawDevs.slnx
│   ├── OpenPawDevs.WebAPI/     # API REST / Controladores
│   ├── OpenPawDevs.Core/        # Entidades, DTOs, Interfaces
│   └── OpenPawDevs.Data/        # EF Core, DbContext, Migraciones
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── App.jsx
├── .gitignore
└── README.md
```

## Licencia

Proyecto académico — Universidad Hispanoamericana.

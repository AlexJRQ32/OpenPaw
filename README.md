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

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

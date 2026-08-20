# OpenPaw Devs ??

> Carnet de mascotas compartible — tipo EDUS de Costa Rica
> Proyecto académico - Desarrollo de Aplicaciones (8.º cuatrimestre, Universidad Hispanoamericana)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + Vite + pnpm |
| **Backend** | ASP.NET Core Web API (.NET 10) |
| **Base de Datos** | SQL Server (Somee.com) |
| **DevOps** | Azure DevOps (Git + Boards) |
| **Autenticación** | JWT + BCrypt + OAuth 2.0 |

## Estructura del Proyecto

```
OpenPaw Devs/
+-- backend/
¦   +-- OpenPawDevs.slnx
¦   +-- OpenPawDevs.Core/        # Entidades, DTOs, Interfaces, Servicios
¦   +-- OpenPawDevs.Data/        # DbContext, Configuraciones EF, Repositorios
¦   +-- OpenPawDevs.WebAPI/      # Controladores REST, Middleware, Program.cs
+-- frontend/
¦   +-- src/
¦   +-- index.html
¦   +-- package.json
+-- docs/                        # Documentación del proyecto
+-- database/
    +-- script.sql               # Script de base de datos
```

## Enlaces Rápidos

- **Azure DevOps:** https://dev.azure.com/DesarrolloAplicacionesScrumTeam/OpenPaw%20Devs
- **API Swagger:** http://localhost:5199/swagger
- **Documentación:** [docs/README.md](./docs/README.md)

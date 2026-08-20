# Sprint 1 - Progreso ??

> Período: Junio 2026
> Proyecto: OpenPaw Devs
> Azure DevOps: https://dev.azure.com/DesarrolloAplicacionesScrumTeam/OpenPaw%20Devs

## Resumen

| Métrica | Valor |
|---------|-------|
| Total PBIs Sprint 1 | 15 |
| PBIs Cubiertos | 15/15 (100%) |
| Endpoints Creados | 58 |
| Archivos Backend | ~102 |
| Base de Datos | 13 tablas en Somee |

## PBIs Completados

### Epic 3: Registrarse - Crear cuenta y acceder
| PBI | Título | Estado | Endpoint |
|-----|--------|--------|----------|
| 10 | Login con usuario y contraseña | ? | `POST /api/auth/login` |
| 44 | Login con Google | ? | `POST /api/auth/login-google` |
| 45 | Login con Facebook | ? | `POST /api/auth/login-facebook` |
| 46 | Registro autoservicio: Clientes | ? | `POST /api/auth/register` |
| 47 | Registro Clientes con Google | ? | `POST /api/auth/login-google` |
| 48 | Registro Clientes con Facebook | ? | `POST /api/auth/login-facebook` |
| 49 | Perfil del Usuario | ? | `GET/PUT /api/usuarios/{id}` |

### Epic 31: Gestión de Comercios
| PBI | Título | Estado | Endpoint |
|-----|--------|--------|----------|
| 50 | Solicitud registro: Veterinaria | ? | `POST /api/veterinarias` |
| 51 | Solicitud registro: Almacén | ? | `POST /api/almacenes` |
| 52 | Aprobación de comercios | ? | `PUT /api/veterinarias/{id}/aprobar` |
| 53 | Gestión de funcionarios | ? | `GET /api/usuarios/rol/{rolId}` |

### Epic 32: Configuración de Plataforma
| PBI | Título | Estado |
|-----|--------|--------|
| 54 | Set up del repositorio | ? |
| 55 | Configuración de ambientes locales | ? |

## Epics Futuras

| Epic | Título | Estado |
|------|--------|--------|
| 4 | Registrar Mascota - Dar de alta al paciente | ?? Por iniciar |
| 5 | Agendar Cita - Reservar consulta | ?? Por iniciar |
| 6 | Atender Consulta - Diagnóstico y receta | ?? Por iniciar |
| 7 | Tratamiento - Seguimiento y vacunas | ?? Por iniciar |
| 8 | Reportes - Datos y estadísticas | ?? Por iniciar |
| 9 | Marketplace - Productos y servicios | ?? Por iniciar |

## Estructura de Ramas

```
main
+-- Develop
    +-- feature/backend-estructura-inicial  (mergeada ?)
    +-- docs/endpoint-backend               (disponible)
```

## Configuración Pendiente

- [ ] Facebook App ID + Secret (en `appsettings.Development.json`)
- [ ] Probar login con Google (requiere frontend)
- [ ] Probar login con Facebook (requiere App ID + frontend)

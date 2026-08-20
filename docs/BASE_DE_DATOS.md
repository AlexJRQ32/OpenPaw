# Base de Datos - OpenPawDB ???

> Plataforma: SQL Server (Somee.com)
> Base de datos: `OpenPawDB`
> Connection String: `Server=OpenPawDB.mssql.somee.com;Database=OpenPawDB;User ID=OpenPawDB_SQLLogin_1;Password=dpdpvii1z1;TrustServerCertificate=True;`

## Diagrama Entidad-Relación

```
Roles ------< Usuarios ------< Notificaciones
                ¦
                +------< Mascotas ------< Expedientes ------< ExpedientesCompartidos
                            ¦                                      ¦
                            +------< Citas                    >----+
                                                                   
Veterinarias --< Almacenes --< Inventario --> Productos
     ¦              ¦
     +------< Citas ¦
     ¦              ¦
     +------< Expedientes
     ¦
     +------< Pedidos (origen/destino) ------< PedidoDetalles --> Productos
```

## Tablas (13)

### Roles
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| Id | INT IDENTITY | PK |
| Nombre | NVARCHAR(100) | NOT NULL |
| Descripcion | NVARCHAR(255) | NULL |

**Seed data:** Administrador, Veterinaria, Almacen, Cliente

### Usuarios
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| Id | INT IDENTITY | PK |
| Nombre | NVARCHAR(200) | NOT NULL |
| Email | NVARCHAR(200) | NOT NULL, UNIQUE |
| PasswordHash | NVARCHAR(500) | NOT NULL |
| Telefono | NVARCHAR(50) | NULL |
| Direccion | NVARCHAR(500) | NULL |
| RolId | INT | FK ? Roles.Id, DEFAULT 4 |
| Activo | BIT | DEFAULT 1 |
| FechaRegistro | DATETIME2 | DEFAULT GETUTCDATE() |
| FotoUrl | NVARCHAR(500) | NULL |
| RefreshToken | NVARCHAR(500) | NULL |
| RefreshTokenExpiry | DATETIME2 | NULL |

### Mascotas
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| Id | INT IDENTITY | PK |
| Nombre | NVARCHAR(200) | NOT NULL |
| Especie | NVARCHAR(100) | NOT NULL |
| Raza | NVARCHAR(100) | NULL |
| Sexo | INT | NOT NULL (1=Macho, 2=Hembra) |
| FechaNacimiento | DATETIME2 | NULL |
| Peso | DECIMAL(18,2) | NULL |
| Color | NVARCHAR(100) | NULL |
| Identificacion | NVARCHAR(100) | NULL |
| FotoUrl | NVARCHAR(500) | NULL |
| DuenioId | INT | FK ? Usuarios.Id |
| Activo | BIT | DEFAULT 1 |
| FechaRegistro | DATETIME2 | DEFAULT GETUTCDATE() |

### Veterinarias
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| Id | INT IDENTITY | PK |
| Nombre | NVARCHAR(200) | NOT NULL |
| Direccion | NVARCHAR(500) | NULL |
| Telefono | NVARCHAR(50) | NULL |
| Email | NVARCHAR(200) | NULL |
| Horario | NVARCHAR(500) | NULL |
| LogoUrl | NVARCHAR(500) | NULL |
| Activo | BIT | DEFAULT 1 |
| Aprobada | BIT | DEFAULT 0 |
| FechaRegistro | DATETIME2 | DEFAULT GETUTCDATE() |

### Expedientes, Citas, Almacenes, Productos, Inventario, Pedidos, etc.
? Ver script completo en `database/script.sql`

## Script SQL

El script completo para crear la base de datos está en:
```
database/script.sql
```

Para ejecutarlo:
1. Ir a Somee.com ? Panel de control ? Editor de consultas SQL
2. Pegar el contenido de `database/script.sql`
3. Ejecutar

-- Migracion: Agregar columnas faltantes para aprobaciones
-- Tabla: Veterinarias
ALTER TABLE Veterinarias ADD CedulaJuridica NVARCHAR(30) NULL;
ALTER TABLE Veterinarias ADD Descripcion NVARCHAR(1000) NULL;
ALTER TABLE Veterinarias ADD RepresentanteLegalNombre NVARCHAR(150) NULL;
ALTER TABLE Veterinarias ADD RepresentanteLegalIdentificacion NVARCHAR(50) NULL;
ALTER TABLE Veterinarias ADD RepresentanteLegalRol NVARCHAR(100) NULL;
ALTER TABLE Veterinarias ADD UsuarioId INT NOT NULL DEFAULT 0;
ALTER TABLE Veterinarias ADD Rechazada BIT NOT NULL DEFAULT 0;
ALTER TABLE Veterinarias ADD MotivoRechazo NVARCHAR(500) NULL;

-- Tabla: Almacenes
ALTER TABLE Almacenes ADD Descripcion NVARCHAR(1000) NULL;
ALTER TABLE Almacenes ADD MotivoRechazo NVARCHAR(500) NULL;
ALTER TABLE Almacenes ADD UsuarioId INT NOT NULL DEFAULT 0;

-- Tabla: Almacenes - representante legal
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Almacenes' AND COLUMN_NAME = 'RepresentanteLegalNombre')
    ALTER TABLE Almacenes ADD RepresentanteLegalNombre NVARCHAR(150) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Almacenes' AND COLUMN_NAME = 'RepresentanteLegalIdentificacion')
    ALTER TABLE Almacenes ADD RepresentanteLegalIdentificacion NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Almacenes' AND COLUMN_NAME = 'RepresentanteLegalRol')
    ALTER TABLE Almacenes ADD RepresentanteLegalRol NVARCHAR(100) NULL;

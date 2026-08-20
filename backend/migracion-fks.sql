-- =============================================================
-- Migration: Agregar Foreign Keys faltantes
-- Fecha: Julio 2026
-- =============================================================

-- 1. FK: Veterinarias.UsuarioId -> Usuarios.Id
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Veterinarias_Usuarios')
BEGIN
    ALTER TABLE Veterinarias
    ADD CONSTRAINT FK_Veterinarias_Usuarios
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id);
    PRINT 'FK_Veterinarias_Usuarios creada';
END
GO

-- 2. FK: Almacenes.UsuarioId -> Usuarios.Id
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Almacenes_Usuarios')
BEGIN
    ALTER TABLE Almacenes
    ADD CONSTRAINT FK_Almacenes_Usuarios
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id);
    PRINT 'FK_Almacenes_Usuarios creada';
END
GO

-- 3. Agregar VeterinariaId a Usuarios (nullable)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'VeterinariaId')
BEGIN
    ALTER TABLE Usuarios
    ADD VeterinariaId INT NULL;
    PRINT 'Columna Usuarios.VeterinariaId agregada';
END
GO

-- 4. FK: Usuarios.VeterinariaId -> Veterinarias.Id
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Usuarios_Veterinarias')
BEGIN
    ALTER TABLE Usuarios
    ADD CONSTRAINT FK_Usuarios_Veterinarias
    FOREIGN KEY (VeterinariaId) REFERENCES Veterinarias(Id);
    PRINT 'FK_Usuarios_Veterinarias creada';
END
GO

-- 5. Agregar AlmacenId a Usuarios (nullable)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'AlmacenId')
BEGIN
    ALTER TABLE Usuarios
    ADD AlmacenId INT NULL;
    PRINT 'Columna Usuarios.AlmacenId agregada';
END
GO

-- 6. FK: Usuarios.AlmacenId -> Almacenes.Id
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Usuarios_Almacenes')
BEGIN
    ALTER TABLE Usuarios
    ADD CONSTRAINT FK_Usuarios_Almacenes
    FOREIGN KEY (AlmacenId) REFERENCES Almacenes(Id);
    PRINT 'FK_Usuarios_Almacenes creada';
END
GO

-- 7. Backfill: Asignar VeterinariaId a usuarios duenos de veterinaria
UPDATE u
SET u.VeterinariaId = v.Id
FROM Usuarios u
INNER JOIN Veterinarias v ON v.UsuarioId = u.Id
WHERE u.VeterinariaId IS NULL;
PRINT 'Backfill Usuarios.VeterinariaId completado';
GO

-- 8. Backfill: Asignar AlmacenId a usuarios duenos de almacen
UPDATE u
SET u.AlmacenId = a.Id
FROM Usuarios u
INNER JOIN Almacenes a ON a.UsuarioId = u.Id
WHERE u.AlmacenId IS NULL;
PRINT 'Backfill Usuarios.AlmacenId completado';
GO

PRINT 'Migracion de FKs completada.';
GO

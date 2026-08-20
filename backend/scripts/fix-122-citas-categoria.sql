-- ============================================================================
-- Bug #122: GET /api/citas/* devuelve 500 en la BD compartida
-- (OpenPawDB.mssql.somee.com)
-- ----------------------------------------------------------------------------
-- Problema: la migracion EF Core AddCategoriaToCita (PR #83) nunca se aplico a
-- la base compartida, y su historial de migraciones esta desincronizado, por lo
-- que 'dotnet ef database update' intenta recrear tablas existentes.
--
-- Fix minimo y seguro: agregar la columna Categoria a la tabla Citas de forma
-- idempotente, sin tocar el historial de migraciones de la base compartida.
-- ============================================================================

IF COL_LENGTH('dbo.Citas', 'Categoria') IS NULL
BEGIN
    ALTER TABLE dbo.Citas ADD Categoria int NULL;
    PRINT 'Columna Categoria agregada a Citas.';
END
ELSE
BEGIN
    PRINT 'La columna Categoria ya existe en Citas. Nada que hacer.';
END

-- Verificacion: debe devolver una fila con COLUMN_NAME = Categoria
-- SELECT COLUMN_NAME
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'Citas' AND COLUMN_NAME = 'Categoria';

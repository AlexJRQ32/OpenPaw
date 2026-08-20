-- Migracion: PBI 133 - Atencion de emergencias (veterinario no cabecera, dentro y fuera de la plataforma)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Mascotas' AND COLUMN_NAME = 'VeterinariaId')
    ALTER TABLE Mascotas ADD VeterinariaId INT NULL;

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Mascotas_Veterinarias_VeterinariaId')
    ALTER TABLE Mascotas ADD CONSTRAINT FK_Mascotas_Veterinarias_VeterinariaId
        FOREIGN KEY (VeterinariaId) REFERENCES Veterinarias(Id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mascotas_VeterinariaId')
    CREATE INDEX IX_Mascotas_VeterinariaId ON Mascotas(VeterinariaId);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Emergencias')
BEGIN
    CREATE TABLE Emergencias (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        MascotaId INT NOT NULL,
        PropietarioId INT NOT NULL,
        VeterinariaId INT NULL,
        VeterinariaNombreExterna NVARCHAR(150) NULL,
        FechaAtencion DATETIME2 NOT NULL,
        Motivo NVARCHAR(1000) NOT NULL,
        Sintomas NVARCHAR(2000) NULL,
        TratamientoAplicado NVARCHAR(2000) NULL,
        EsEnPlataforma BIT NOT NULL,
        ArchivoAdjuntoUrl NVARCHAR(500) NULL,
        FechaRegistro DATETIME2 NOT NULL,
        CONSTRAINT FK_Emergencias_Mascotas_MascotaId FOREIGN KEY (MascotaId) REFERENCES Mascotas(Id),
        CONSTRAINT FK_Emergencias_Usuarios_PropietarioId FOREIGN KEY (PropietarioId) REFERENCES Usuarios(Id),
        CONSTRAINT FK_Emergencias_Veterinarias_VeterinariaId FOREIGN KEY (VeterinariaId) REFERENCES Veterinarias(Id)
    );

    CREATE INDEX IX_Emergencias_MascotaId ON Emergencias(MascotaId);
    CREATE INDEX IX_Emergencias_PropietarioId ON Emergencias(PropietarioId);
    CREATE INDEX IX_Emergencias_VeterinariaId ON Emergencias(VeterinariaId);
END

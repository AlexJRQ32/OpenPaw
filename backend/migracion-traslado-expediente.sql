-- Migracion: PBI 131 - Traslado de expediente entre veterinarias
-- Tabla: Mascotas - veterinaria de cabecera
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Mascotas' AND COLUMN_NAME = 'VeterinariaId')
    ALTER TABLE Mascotas ADD VeterinariaId INT NULL;

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Mascotas_Veterinarias_VeterinariaId')
    ALTER TABLE Mascotas ADD CONSTRAINT FK_Mascotas_Veterinarias_VeterinariaId
        FOREIGN KEY (VeterinariaId) REFERENCES Veterinarias(Id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mascotas_VeterinariaId')
    CREATE INDEX IX_Mascotas_VeterinariaId ON Mascotas(VeterinariaId);

-- Tabla: TrasladosExpediente
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrasladosExpediente')
BEGIN
    CREATE TABLE TrasladosExpediente (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        MascotaId INT NOT NULL,
        VeterinariaOrigenId INT NOT NULL,
        VeterinariaDestinoId INT NOT NULL,
        Estado NVARCHAR(20) NOT NULL,
        FechaSolicitud DATETIME2 NOT NULL,
        FechaRespuesta DATETIME2 NULL,
        SolicitadoPorId INT NOT NULL,
        Comentario NVARCHAR(1000) NULL,
        MotivoRechazo NVARCHAR(1000) NULL,
        CONSTRAINT FK_TrasladosExpediente_Mascotas_MascotaId FOREIGN KEY (MascotaId) REFERENCES Mascotas(Id),
        CONSTRAINT FK_TrasladosExpediente_Usuarios_SolicitadoPorId FOREIGN KEY (SolicitadoPorId) REFERENCES Usuarios(Id),
        CONSTRAINT FK_TrasladosExpediente_Veterinarias_VeterinariaDestinoId FOREIGN KEY (VeterinariaDestinoId) REFERENCES Veterinarias(Id),
        CONSTRAINT FK_TrasladosExpediente_Veterinarias_VeterinariaOrigenId FOREIGN KEY (VeterinariaOrigenId) REFERENCES Veterinarias(Id)
    );

    CREATE INDEX IX_TrasladosExpediente_MascotaId ON TrasladosExpediente(MascotaId);
    CREATE INDEX IX_TrasladosExpediente_SolicitadoPorId ON TrasladosExpediente(SolicitadoPorId);
    CREATE INDEX IX_TrasladosExpediente_VeterinariaDestinoId ON TrasladosExpediente(VeterinariaDestinoId);
    CREATE INDEX IX_TrasladosExpediente_VeterinariaOrigenId ON TrasladosExpediente(VeterinariaOrigenId);
END

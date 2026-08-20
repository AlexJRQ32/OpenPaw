-- Migracion: PBI 132 - Aporte de expediente para veterinarias fuera de la plataforma
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AportesExpediente')
BEGIN
    CREATE TABLE AportesExpediente (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        MascotaId INT NOT NULL,
        PropietarioId INT NOT NULL,
        VeterinariaNombre NVARCHAR(150) NOT NULL,
        FechaAtencion DATETIME2 NOT NULL,
        TipoAtencion INT NOT NULL,
        Descripcion NVARCHAR(2000) NOT NULL,
        Diagnostico NVARCHAR(1000) NULL,
        Medicamentos NVARCHAR(1000) NULL,
        ArchivoAdjuntoUrl NVARCHAR(500) NULL,
        FechaRegistro DATETIME2 NOT NULL,
        CONSTRAINT FK_AportesExpediente_Mascotas_MascotaId FOREIGN KEY (MascotaId) REFERENCES Mascotas(Id),
        CONSTRAINT FK_AportesExpediente_Usuarios_PropietarioId FOREIGN KEY (PropietarioId) REFERENCES Usuarios(Id)
    );

    CREATE INDEX IX_AportesExpediente_MascotaId ON AportesExpediente(MascotaId);
    CREATE INDEX IX_AportesExpediente_PropietarioId ON AportesExpediente(PropietarioId);
END

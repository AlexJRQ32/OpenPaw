-- ============================================================================
-- Sprint 1 - Tarea #11: SEED de datos demo (idempotente)
-- ----------------------------------------------------------------------------
-- Alimenta la BD local (OpenPawDevs) con datos realistas para que las paginas
-- rediseñadas del Sprint 2 muestren contenido como el de los wireframes:
--   * Mascota "Luna" (Golden Retriever, 2 anos, saludable, prox vacuna Rabia 14 Oct)
--   * Dr. David Chen (veterinario con licencia y sede, OP-VET-0042)
--   * 5 mascotas, citas de tipos distintos, emergencias con signos vitales,
--     inventario con categorias/lotes/estantes, traslados con coordenadas y ETA,
--     funcionarios con ID corporativo, almacenes y veterinarias con lat/lng reales de CR.
--
-- SEGURIDAD / REGLAS:
--   * Solo INSERT idempotente (IF NOT EXISTS por clave natural unica).
--     Re-correr el script NUNCA duplica registros ni toca datos existentes.
--   * NO borra ni modifica datos existentes de la BD.
--   * Passwords demo = hash BCrypt fijo (BCrypt.Net-Next, workfactor 11).
--     Credenciales demo (documentadas abajo):
--       admin@openpaw.dev      / Admin123!
--       david.chen@openpaw.dev / Vet123!
--       laura.jimenez@openpaw.dev / Vet123!
--       marco.alfaro@openpaw.dev  / Vet123!
--       jorge.sandi@openpaw.dev   / Vet123!
--       maria.rodriguez@openpaw.dev / Demo123!
--       carlos.vargas@openpaw.dev  / Demo123!
--
-- EJECUCION LOCAL:
--   El archivo esta guardado con BOM UTF-8 (sqlcmd lo detecta y usa UTF-8).
--   Si el entorno no respeta el BOM, forzar codificacion UTF-8 con -f 65001:
--     sqlcmd -S localhost -d OpenPawDevs -E -C -f 65001 -i backend/scripts/seed-demo-data.sql
--   (NUNCA ejecutar sin BOM ni -f 65001: sqlcmd leería cp850 y los acentos de
--    los literales N'...' se corromperían, rompiendo la idempotencia.)
-- ============================================================================

-- Requerido: el indice unico filtrado IX_Usuarios_IdCorporativo exige
-- QUOTED_IDENTIFIER ON (sqlcmd lo trae OFF por defecto -> error 1934).
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- ---------------------------------------------------------------------------
-- 1) USUARIOS demo (roles: 1=Admin, 2=Veterinaria, 3=Almacen, 4=Cliente)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'admin@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'Ana Mora', N'admin@openpaw.dev',
        N'$2a$11$0ahbk6w9Mi7dK5AkdwQQOegX3/NGMqMr8ipF33kqJeFFZkGL.sx66', -- Admin123!
        N'+506 8888-1001', N'+506 8888-1002', N'San José, Costa Rica',
        NULL, '2024-01-15', 1, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=Ana',
        N'OP-ADM-0001', N'Administración', N'San José', N'Activo');
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'david.chen@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'Dr. David Chen', N'david.chen@openpaw.dev',
        N'$2a$11$srcRmVpbYWzB4776iVrg.uwAjmR0PX9axodO4V1zu.GHqJnOjYt.G', -- Vet123!
        N'+506 8888-2001', N'+506 8888-2002', N'Puntarenas, Costa Rica',
        N'CR-VET-88912', '2022-03-01', 2, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=David+Chen',
        N'OP-VET-0042', N'Medicina Interna', N'Puntarenas', N'Activo');
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'laura.jimenez@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'Dra. Laura Jiménez', N'laura.jimenez@openpaw.dev',
        N'$2a$11$srcRmVpbYWzB4776iVrg.uwAjmR0PX9axodO4V1zu.GHqJnOjYt.G', -- Vet123!
        N'+506 8888-3001', NULL, N'Heredia, Costa Rica',
        N'CR-VET-77456', '2021-06-15', 2, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=Laura',
        N'OP-VET-0043', N'Dermatología', N'Heredia', N'Vacaciones');
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'marco.alfaro@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'Dr. Marco Alfaro', N'marco.alfaro@openpaw.dev',
        N'$2a$11$srcRmVpbYWzB4776iVrg.uwAjmR0PX9axodO4V1zu.GHqJnOjYt.G', -- Vet123!
        N'+506 8888-4001', N'+506 8888-4002', N'Cartago, Costa Rica',
        N'CR-VET-66123', '2023-09-10', 2, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=Marco',
        N'OP-VET-0044', N'Cirugía', N'Cartago', N'Activo');
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'María Rodríguez', N'maria.rodriguez@openpaw.dev',
        N'$2a$11$FSRoQqVG0E/IluTUDkj.yO8vmJoFQcPAygul6GAC2IsXuECgpiKrK', -- Demo123!
        N'+506 8888-5001', NULL, N'San José, Costa Rica',
        NULL, NULL, 4, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=Maria',
        NULL, NULL, NULL, NULL);
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'Carlos Vargas', N'carlos.vargas@openpaw.dev',
        N'$2a$11$FSRoQqVG0E/IluTUDkj.yO8vmJoFQcPAygul6GAC2IsXuECgpiKrK', -- Demo123!
        N'+506 8888-6001', NULL, N'Heredia, Costa Rica',
        NULL, NULL, 4, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=Carlos',
        NULL, NULL, NULL, NULL);
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'jorge.sandi@openpaw.dev')
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TelefonoEmergencia, Direccion,
        LicenciaMedica, FechaIncorporacion, RolId, Activo, FechaRegistro, FotoUrl,
        IdCorporativo, Especialidad, Sede, Estado)
    VALUES (N'Jorge Sandí', N'jorge.sandi@openpaw.dev',
        N'$2a$11$srcRmVpbYWzB4776iVrg.uwAjmR0PX9axodO4V1zu.GHqJnOjYt.G', -- Vet123!
        N'+506 8888-7001', NULL, N'Cartago, Costa Rica',
        NULL, '2022-11-01', 3, 1, '2026-08-21 00:00:00', 'https://placehold.co/400x400?text=Jorge',
        N'OP-ALM-0007', N'Logística y Almacén', N'Cartago', N'Activo');
END

-- ---------------------------------------------------------------------------
-- 2) VETERINARIAS demo (coordenadas reales de Costa Rica; no toca la existente)
--    San José ~9.9281,-84.0907 | Heredia ~9.9981,-84.1198 | Cartago ~9.8644,-83.9194
--    Puntarenas ~9.9763,-84.8382
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas')
BEGIN
    INSERT INTO Veterinarias (Nombre, Direccion, Telefono, Email, Horario, LogoUrl, Activo, Aprobada,
        FechaRegistro, CedulaJuridica, Descripcion, DocumentoPersoneriaJuridica, RazonSocial, Nit,
        CorreoOficial, Latitud, Longitud, UsuarioId, Rechazada)
    VALUES (N'Clínica Veterinaria Puntarenas', N'Av. Central, Puntarenas Centro', N'+506 2661-1234',
        N'contacto@vetpuntarenas.cr', N'Lun-Sáb 8:00-18:00', 'https://placehold.co/200x200?text=Vet+PT',
        1, 1, '2026-08-21 00:00:00', N'3-101-234567', N'Clínica veterinaria general y urgencias.',
        NULL, N'Clínica Veterinaria Puntarenas S.A.', N'3101234567',
        N'oficial@vetpuntarenas.cr', 9.9763000, -84.8382000,
        (SELECT Id FROM Usuarios WHERE Email = 'david.chen@openpaw.dev'), 0);
END

IF NOT EXISTS (SELECT 1 FROM Veterinarias WHERE Nombre = N'VetCare Heredia')
BEGIN
    INSERT INTO Veterinarias (Nombre, Direccion, Telefono, Email, Horario, LogoUrl, Activo, Aprobada,
        FechaRegistro, CedulaJuridica, Descripcion, DocumentoPersoneriaJuridica, RazonSocial, Nit,
        CorreoOficial, Latitud, Longitud, UsuarioId, Rechazada)
    VALUES (N'VetCare Heredia', N'Barreal de Heredia, 300 m norte del Mall', N'+506 2261-5678',
        N'info@vetcareheredia.cr', N'Lun-Vie 8:00-19:00, Sáb 9:00-17:00', 'https://placehold.co/200x200?text=VetCare',
        1, 1, '2026-08-21 00:00:00', N'3-102-345678', N'Especialidades veterinarias y laboratorio.',
        NULL, N'VetCare Heredia S.R.L.', N'3102345678',
        N'oficial@vetcareheredia.cr', 9.9981000, -84.1198000,
        (SELECT Id FROM Usuarios WHERE Email = 'laura.jimenez@openpaw.dev'), 0);
END

IF NOT EXISTS (SELECT 1 FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago')
BEGIN
    INSERT INTO Veterinarias (Nombre, Direccion, Telefono, Email, Horario, LogoUrl, Activo, Aprobada,
        FechaRegistro, CedulaJuridica, Descripcion, DocumentoPersoneriaJuridica, RazonSocial, Nit,
        CorreoOficial, Latitud, Longitud, UsuarioId, Rechazada)
    VALUES (N'Hospital Veterinario Cartago', N'Calle 3, Cartago Central', N'+506 2551-9012',
        N'atencion@hospvetcartago.cr', N'24 horas', 'https://placehold.co/200x200?text=HVC',
        1, 1, '2026-08-21 00:00:00', N'3-103-456789', N'Hospital veterinario con cirugía y UCI.',
        NULL, N'Hospital Veterinario Cartago S.A.', N'3103456789',
        N'oficial@hospvetcartago.cr', 9.8644000, -83.9194000,
        (SELECT Id FROM Usuarios WHERE Email = 'marco.alfaro@openpaw.dev'), 0);
END

-- Vincular veterinarios a su sede (update SOLO sobre usuarios demo del seed)
UPDATE Usuarios SET VeterinariaId = (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas')
WHERE Email = 'david.chen@openpaw.dev' AND VeterinariaId IS NULL;

UPDATE Usuarios SET VeterinariaId = (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia')
WHERE Email = 'laura.jimenez@openpaw.dev' AND VeterinariaId IS NULL;

UPDATE Usuarios SET VeterinariaId = (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago')
WHERE Email = 'marco.alfaro@openpaw.dev' AND VeterinariaId IS NULL;

-- ---------------------------------------------------------------------------
-- 3) ALMACENES demo (TipoAlmacen: Interno=1, Externo=2, CentroDistribucion=3)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Almacenes WHERE Nombre = N'Bodega Central Heredia')
BEGIN
    INSERT INTO Almacenes (Nombre, VeterinariaId, CedulaJuridica, Telefono, Email, FechaRegistro,
        Aprobada, Rechazada, Direccion, Tipo, Descripcion, MotivoRechazo, UsuarioId, Activo,
        TipoAlmacen, NombreResponsable, CapacidadAlmacenamiento, ControlTemperatura, Latitud, Longitud)
    VALUES (N'Bodega Central Heredia',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        N'3-102-345678', N'+506 2261-5679', N'bodega@vetcareheredia.cr', '2026-08-21 00:00:00',
        1, 0, N'Barreal de Heredia', 1, N'Bodega interna anexa a la clínica.', NULL,
        (SELECT Id FROM Usuarios WHERE Email = 'jorge.sandi@openpaw.dev'), 1,
        N'Interno', N'Jorge Sandí', N'De150a500', N'Mixto', 9.9981000, -84.1198000);
END

IF NOT EXISTS (SELECT 1 FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago')
BEGIN
    INSERT INTO Almacenes (Nombre, VeterinariaId, CedulaJuridica, Telefono, Email, FechaRegistro,
        Aprobada, Rechazada, Direccion, Tipo, Descripcion, MotivoRechazo, UsuarioId, Activo,
        TipoAlmacen, NombreResponsable, CapacidadAlmacenamiento, ControlTemperatura, Latitud, Longitud)
    VALUES (N'Centro de Distribución Cartago',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago'),
        N'3-103-456789', N'+506 2551-9013', N'cd@hospvetcartago.cr', '2026-08-21 00:00:00',
        1, 0, N'Zona Industrial de Cartago', 3, N'Centro de distribución con cadena de frío.', NULL,
        (SELECT Id FROM Usuarios WHERE Email = 'jorge.sandi@openpaw.dev'), 1,
        N'CentroDistribucion', N'Jorge Sandí', N'Mas500', N'CadenaFrio', 9.8644000, -83.9194000);
END

UPDATE Usuarios SET AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia')
WHERE Email = 'jorge.sandi@openpaw.dev' AND AlmacenId IS NULL;

-- ---------------------------------------------------------------------------
-- 4) PRODUCTOS demo (los 3 existentes NO se tocan; se agregan para inventario)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = N'Amoxicilina 500mg')
BEGIN
    INSERT INTO Productos (Nombre, Descripcion, Precio, Categoria, Proveedor, ImagenUrl, UnidadMedida, Activo, FechaRegistro)
    VALUES (N'Amoxicilina 500mg', N'Antibiótico de amplio espectro para uso veterinario.', 12000.00,
        N'Antibioticos', N'Distribuidora Vet CR', 'https://placehold.co/400x400?text=Amoxi', N'Frasco', 1, '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = N'Vacuna Rabia Canina')
BEGIN
    INSERT INTO Productos (Nombre, Descripcion, Precio, Categoria, Proveedor, ImagenUrl, UnidadMedida, Activo, FechaRegistro)
    VALUES (N'Vacuna Rabia Canina', N'Vacuna antirrábica inactivada, dosis única.', 18000.00,
        N'Vacunas', N'Laboratorios VetCR', 'https://placehold.co/400x400?text=Rabia', N'Dosis', 1, '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = N'Guantes Quirúrgicos')
BEGIN
    INSERT INTO Productos (Nombre, Descripcion, Precio, Categoria, Proveedor, ImagenUrl, UnidadMedida, Activo, FechaRegistro)
    VALUES (N'Guantes Quirúrgicos', N'Guantes de nitrilo sin polvo, talla M.', 4500.00,
        N'Quirurgico', N'MediVet', 'https://placehold.co/400x400?text=Guantes', N'Caja', 1, '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = N'Jeringas 5ml')
BEGIN
    INSERT INTO Productos (Nombre, Descripcion, Precio, Categoria, Proveedor, ImagenUrl, UnidadMedida, Activo, FechaRegistro)
    VALUES (N'Jeringas 5ml', N'Jeringas desechables estériles con aguja 21G.', 3500.00,
        N'Consumibles', N'MediVet', 'https://placehold.co/400x400?text=Jeringas', N'Caja', 1, '2026-08-21 00:00:00');
END

-- ---------------------------------------------------------------------------
-- 5) MASCOTAS demo (Sexo: 1=Macho, 2=Hembra) — Luna + 4 más
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Mascotas WHERE Nombre = N'Luna' AND DuenioId = (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'))
BEGIN
    INSERT INTO Mascotas (Nombre, Especie, Raza, Sexo, FechaNacimiento, Peso, Color, Identificacion,
        FotoUrl, DuenioId, Activo, FechaRegistro, VeterinariaId, EstadoSalud, ProximaVacuna,
        ProximaVacunaFecha, MedicacionActual, ProximaMedicacionFecha)
    VALUES (N'Luna', N'Perro', N'Golden Retriever', 2, '2024-06-15', 28.50, N'Dorado', N'CR-2024-0001',
        'https://placehold.co/400x400?text=Luna',
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'), 1, '2026-08-21 00:00:00',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        N'Saludable', N'Rabia', '2026-10-14', NULL, NULL);
END

IF NOT EXISTS (SELECT 1 FROM Mascotas WHERE Nombre = N'Rocky' AND DuenioId = (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'))
BEGIN
    INSERT INTO Mascotas (Nombre, Especie, Raza, Sexo, FechaNacimiento, Peso, Color, Identificacion,
        FotoUrl, DuenioId, Activo, FechaRegistro, VeterinariaId, EstadoSalud, ProximaVacuna,
        ProximaVacunaFecha, MedicacionActual, ProximaMedicacionFecha)
    VALUES (N'Rocky', N'Perro', N'Bulldog Francés', 1, '2023-03-20', 12.00, N'Blanco y negro', N'CR-2023-0012',
        'https://placehold.co/400x400?text=Rocky',
        (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'), 1, '2026-08-21 00:00:00',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        N'Tratamiento', N'Triple Canina', '2026-11-20', N'Ampicilina 250mg c/12h por 7 días', '2026-08-28');
END

IF NOT EXISTS (SELECT 1 FROM Mascotas WHERE Nombre = N'Michi' AND DuenioId = (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'))
BEGIN
    INSERT INTO Mascotas (Nombre, Especie, Raza, Sexo, FechaNacimiento, Peso, Color, Identificacion,
        FotoUrl, DuenioId, Activo, FechaRegistro, VeterinariaId, EstadoSalud, ProximaVacuna,
        ProximaVacunaFecha, MedicacionActual, ProximaMedicacionFecha)
    VALUES (N'Michi', N'Gato', N'Siamés', 2, '2022-01-10', 4.20, N'Crema', N'CR-2022-0105',
        'https://placehold.co/400x400?text=Michi',
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'), 1, '2026-08-21 00:00:00',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        N'Saludable', N'Triple Felina', '2026-11-05', NULL, NULL);
END

IF NOT EXISTS (SELECT 1 FROM Mascotas WHERE Nombre = N'Bella' AND DuenioId = (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'))
BEGIN
    INSERT INTO Mascotas (Nombre, Especie, Raza, Sexo, FechaNacimiento, Peso, Color, Identificacion,
        FotoUrl, DuenioId, Activo, FechaRegistro, VeterinariaId, EstadoSalud, ProximaVacuna,
        ProximaVacunaFecha, MedicacionActual, ProximaMedicacionFecha)
    VALUES (N'Bella', N'Perro', N'Cocker Spaniel', 2, '2021-07-30', 15.00, N'Dorado', N'CR-2021-0022',
        'https://placehold.co/400x400?text=Bella',
        (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'), 1, '2026-08-21 00:00:00',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        N'Tratamiento', N'Rabia', '2026-09-30', N'Metronidazol 250mg c/12h por 5 días', '2026-08-25');
END

IF NOT EXISTS (SELECT 1 FROM Mascotas WHERE Nombre = N'Toby' AND DuenioId = (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'))
BEGIN
    INSERT INTO Mascotas (Nombre, Especie, Raza, Sexo, FechaNacimiento, Peso, Color, Identificacion,
        FotoUrl, DuenioId, Activo, FechaRegistro, VeterinariaId, EstadoSalud, ProximaVacuna,
        ProximaVacunaFecha, MedicacionActual, ProximaMedicacionFecha)
    VALUES (N'Toby', N'Perro', N'Criollo', 1, '2025-04-18', 8.70, N'Negro', N'CR-2025-0044',
        'https://placehold.co/400x400?text=Toby',
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'), 1, '2026-08-21 00:00:00',
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago'),
        N'Saludable', N'Distemper', '2026-09-18', NULL, NULL);
END

-- ---------------------------------------------------------------------------
-- 6) CITAS demo (TipoCita: Rutina/Especialista/Urgencia; Estados variados)
--    Categoria (CategoriaServicioVeterinario): 1=Consulta, 2=Grooming, 3=Procedimiento
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Citas WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Luna')
    AND FechaHora = '2026-08-25 09:30:00' AND TipoCita = N'Rutina' AND Servicio = N'Consulta general')
BEGIN
    INSERT INTO Citas (MascotaId, VeterinariaId, UsuarioId, FechaHora, Estado, TipoCita, Servicio, Categoria, Notas, Costo, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Luna'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'),
        '2026-08-25 09:30:00', N'Confirmada', N'Rutina', N'Consulta general', 1,
        N'Chequeo anual y refuerzo de vacunas.', 25000.00, '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Citas WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Rocky')
    AND FechaHora = '2026-08-27 14:00:00' AND TipoCita = N'Especialista' AND Servicio = N'Consulta dermatología')
BEGIN
    INSERT INTO Citas (MascotaId, VeterinariaId, UsuarioId, FechaHora, Estado, TipoCita, Servicio, Categoria, Notas, Costo, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Rocky'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'),
        '2026-08-27 14:00:00', N'Pendiente', N'Especialista', N'Consulta dermatología', 1,
        N'Control de dermatitis atópica con especialista.', 35000.00, '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Citas WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Michi')
    AND FechaHora = '2026-08-10 10:00:00' AND TipoCita = N'Rutina' AND Servicio = N'Vacunación triple felina')
BEGIN
    INSERT INTO Citas (MascotaId, VeterinariaId, UsuarioId, FechaHora, Estado, TipoCita, Servicio, Categoria, Notas, Costo, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Michi'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'),
        '2026-08-10 10:00:00', N'Completada', N'Rutina', N'Vacunación triple felina', 1,
        N'Vacuna aplicada sin complicaciones.', 20000.00, '2026-08-05 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Citas WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Bella')
    AND FechaHora = '2026-08-21 16:30:00' AND TipoCita = N'Urgencia' AND Servicio = N'Atención de urgencia')
BEGIN
    INSERT INTO Citas (MascotaId, VeterinariaId, UsuarioId, FechaHora, Estado, TipoCita, Servicio, Categoria, Notas, Costo, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Bella'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'),
        '2026-08-21 16:30:00', N'Confirmada', N'Urgencia', N'Atención de urgencia', 3,
        N'Paciente referida por episodio de vómito.', 45000.00, '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Citas WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Luna')
    AND FechaHora = '2026-07-28 11:00:00' AND TipoCita = N'Rutina' AND Servicio = N'Control post-vacunación')
BEGIN
    INSERT INTO Citas (MascotaId, VeterinariaId, UsuarioId, FechaHora, Estado, TipoCita, Servicio, Categoria, Notas, Costo, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Luna'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'),
        '2026-07-28 11:00:00', N'Cancelada', N'Rutina', N'Control post-vacunación', 1,
        N'Cancelada por el propietario.', 25000.00, '2026-07-20 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Citas WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Toby')
    AND FechaHora = '2026-08-21 09:00:00' AND TipoCita = N'Especialista' AND Servicio = N'Consulta nutrición')
BEGIN
    INSERT INTO Citas (MascotaId, VeterinariaId, UsuarioId, FechaHora, Estado, TipoCita, Servicio, Categoria, Notas, Costo, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Toby'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago'),
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'),
        '2026-08-21 09:00:00', N'EnProgreso', N'Especialista', N'Consulta nutrición', 1,
        N'Plan de alimentación para cachorro en crecimiento.', 30000.00, '2026-08-18 00:00:00');
END

-- ---------------------------------------------------------------------------
-- 7) EMERGENCIAS demo (NivelSeveridad: Nivel1_Critico/Nivel2_Urgente/Resuelto)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Emergencias WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Bella')
    AND FechaAtencion = '2026-08-20 15:10:00' AND Motivo = N'Vómito y diarrea con sangre')
BEGIN
    INSERT INTO Emergencias (MascotaId, PropietarioId, VeterinariaId, VeterinariaNombreExterna,
        FechaAtencion, Motivo, Sintomas, TratamientoAplicado, EsEnPlataforma, ArchivoAdjuntoUrl,
        FechaRegistro, NivelSeveridad, FrecuenciaCardiaca, SaturacionO2, Temperatura,
        EstadoPaciente, MedicoACargo, Diagnostico)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Bella'),
        (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'), NULL,
        '2026-08-20 15:10:00', N'Vómito y diarrea con sangre', N'Decaimiento, inapetencia, deshidratación leve.',
        N'Fluidoterapia IV + metronidazol + dieta blanda.', 1, NULL,
        '2026-08-20 15:10:00', N'Nivel2_Urgente', 132, 92, 39.50,
        N'Estable', N'Dr. David Chen', N'Gastroenteritis aguda');
END

IF NOT EXISTS (SELECT 1 FROM Emergencias WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Rocky')
    AND FechaAtencion = '2026-08-19 18:45:00' AND Motivo = N'Abdomen distendido y vómito persistente')
BEGIN
    INSERT INTO Emergencias (MascotaId, PropietarioId, VeterinariaId, VeterinariaNombreExterna,
        FechaAtencion, Motivo, Sintomas, TratamientoAplicado, EsEnPlataforma, ArchivoAdjuntoUrl,
        FechaRegistro, NivelSeveridad, FrecuenciaCardiaca, SaturacionO2, Temperatura,
        EstadoPaciente, MedicoACargo, Diagnostico)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Rocky'),
        (SELECT Id FROM Usuarios WHERE Email = 'carlos.vargas@openpaw.dev'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'), NULL,
        '2026-08-19 18:45:00', N'Abdomen distendido y vómito persistente', N'Dolor abdominal, letargo severo.',
        N'Estabilización, radiografía abdominal y analgesia.', 1, NULL,
        '2026-08-19 18:45:00', N'Nivel1_Critico', 145, 88, 40.10,
        N'Crítico', N'Dra. Laura Jiménez', N'Obstrucción intestinal parcial');
END

IF NOT EXISTS (SELECT 1 FROM Emergencias WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Luna')
    AND FechaAtencion = '2026-07-15 10:30:00' AND Motivo = N'Cojera por posible cuerpo extraño')
BEGIN
    INSERT INTO Emergencias (MascotaId, PropietarioId, VeterinariaId, VeterinariaNombreExterna,
        FechaAtencion, Motivo, Sintomas, TratamientoAplicado, EsEnPlataforma, ArchivoAdjuntoUrl,
        FechaRegistro, NivelSeveridad, FrecuenciaCardiaca, SaturacionO2, Temperatura,
        EstadoPaciente, MedicoACargo, Diagnostico)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Luna'),
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'), NULL,
        '2026-07-15 10:30:00', N'Cojera por posible cuerpo extraño', N'Lame la pata derecha, molestia al caminar.',
        N'Extracción de espina y limpieza de la herida.', 1, NULL,
        '2026-07-15 10:30:00', N'Resuelto', 110, 98, 38.90,
        N'Recuperado', N'Dr. David Chen', N'Cuerpo extraño en almohadilla plantar');
END

IF NOT EXISTS (SELECT 1 FROM Emergencias WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Michi')
    AND FechaAtencion = '2026-08-18 20:20:00' AND Motivo = N'Posible intoxicación')
BEGIN
    INSERT INTO Emergencias (MascotaId, PropietarioId, VeterinariaId, VeterinariaNombreExterna,
        FechaAtencion, Motivo, Sintomas, TratamientoAplicado, EsEnPlataforma, ArchivoAdjuntoUrl,
        FechaRegistro, NivelSeveridad, FrecuenciaCardiaca, SaturacionO2, Temperatura,
        EstadoPaciente, MedicoACargo, Diagnostico)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Michi'),
        (SELECT Id FROM Usuarios WHERE Email = 'maria.rodriguez@openpaw.dev'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago'), N'Clínica Vet Cartago',
        '2026-08-18 20:20:00', N'Posible intoxicación', N'Salivación excesiva, temblores, vómito.',
        N'Lavado gástrico, carbón activado y observación.', 0, NULL,
        '2026-08-18 20:20:00', N'Nivel1_Critico', 158, 85, 39.00,
        N'En observación', N'Dr. Marco Alfaro', N'Intoxicación por lirio (Lilium sp.)');
END

-- ---------------------------------------------------------------------------
-- 8) INVENTARIO demo (clave unica ProductoId+AlmacenId; categorias/lotes/estantes)
--    CategoriaInventario: Antibiotico/Biologicos/Quirurgico/Consumibles
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Amoxicilina 500mg')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Amoxicilina 500mg'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'),
        45, 10, 100, N'Antibiotico', N'LOT-2026-001', N'Estante A-1', N'Frasco', '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Vacuna Rabia Canina')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Vacuna Rabia Canina'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'),
        120, 20, 200, N'Biologicos', N'LOT-2026-014', N'Refrigerador R-2', N'Dosis', '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Guantes Quirúrgicos')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Guantes Quirúrgicos'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'),
        30, 5, 60, N'Consumibles', N'LOT-2026-007', N'Estante C-3', N'Caja', '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Shampoo Medicado')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Shampoo Medicado'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Bodega Central Heredia'),
        18, 4, 40, N'Consumibles', N'LOT-2026-005', N'Estante B-2', N'Frasco', '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Jeringas 5ml')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Jeringas 5ml'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago'),
        200, 40, 500, N'Consumibles', N'LOT-2026-010', N'Estante A-4', N'Caja', '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Vacuna Rabia Canina')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Vacuna Rabia Canina'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago'),
        60, 10, 150, N'Biologicos', N'LOT-2026-015', N'Cámara fría CF-1', N'Dosis', '2026-08-21 00:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Inventarios
    WHERE ProductoId = (SELECT Id FROM Productos WHERE Nombre = N'Alimento Premium Perro')
      AND AlmacenId = (SELECT Id FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago'))
BEGIN
    INSERT INTO Inventarios (ProductoId, AlmacenId, Cantidad, StockMinimo, StockMaximo, Categoria,
        Lote, Ubicacion, UnidadMedida, FechaActualizacion)
    VALUES ((SELECT Id FROM Productos WHERE Nombre = N'Alimento Premium Perro'),
        (SELECT Id FROM Almacenes WHERE Nombre = N'Centro de Distribución Cartago'),
        85, 15, 150, N'Consumibles', N'LOT-2026-003', N'Estante D-1', N'Bolsa', '2026-08-21 00:00:00');
END

-- ---------------------------------------------------------------------------
-- 9) EXPEDIENTES demo (para los traslados)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Expedientes WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Luna')
    AND FechaConsulta = '2026-08-10 10:00:00' AND Diagnostico = N'Saludable')
BEGIN
    INSERT INTO Expedientes (MascotaId, VeterinariaId, FechaConsulta, Diagnostico, Tratamiento,
        Observaciones, RecetaUrl, ArchivoUrl, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Luna'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        '2026-08-10 10:00:00', N'Saludable', N'Vacuna Rabia aplicada',
        N'Sin hallazgos anormales. Refuerzo de Rabia programado para oct 2026.', NULL, NULL,
        '2026-08-10 10:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Expedientes WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Bella')
    AND FechaConsulta = '2026-08-20 16:00:00' AND Diagnostico = N'Gastroenteritis aguda')
BEGIN
    INSERT INTO Expedientes (MascotaId, VeterinariaId, FechaConsulta, Diagnostico, Tratamiento,
        Observaciones, RecetaUrl, ArchivoUrl, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Bella'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        '2026-08-20 16:00:00', N'Gastroenteritis aguda', N'Fluidoterapia + metronidazol',
        N'Continuar dieta blanda 3 días y revalorar.', NULL, NULL,
        '2026-08-20 16:00:00');
END

IF NOT EXISTS (SELECT 1 FROM Expedientes WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Rocky')
    AND FechaConsulta = '2026-08-19 19:00:00' AND Diagnostico = N'Dermatitis atópica')
BEGIN
    INSERT INTO Expedientes (MascotaId, VeterinariaId, FechaConsulta, Diagnostico, Tratamiento,
        Observaciones, RecetaUrl, ArchivoUrl, FechaCreacion)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Rocky'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        '2026-08-19 19:00:00', N'Dermatitis atópica', N'Corticoides tópicos y antihistamínico',
        N'Control por especialista en 2 semanas.', NULL, NULL,
        '2026-08-19 19:00:00');
END

-- ---------------------------------------------------------------------------
-- 10) TRASLADOS DE EXPEDIENTE demo
--     (Estado aprobacion: Solicitado/Aceptado/Rechazado | EstadoLogistica:
--      Programado/EnTransito/Completado) con coords origen->destino, ETA y salida
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM TrasladosExpediente
    WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Luna')
      AND VeterinariaOrigenId = (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas')
      AND VeterinariaDestinoId = (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia')
      AND EstadoLogistica = N'Programado')
BEGIN
    INSERT INTO TrasladosExpediente (MascotaId, VeterinariaOrigenId, VeterinariaDestinoId, Estado,
        FechaSolicitud, FechaRespuesta, SolicitadoPorId, Comentario, MotivoRechazo, EstadoLogistica,
        OrigenLatitud, OrigenLongitud, DestinoLatitud, DestinoLongitud, EtaLlegada, Salida)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Luna'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        N'Solicitado', '2026-08-21 08:00:00', NULL,
        (SELECT Id FROM Usuarios WHERE Email = 'david.chen@openpaw.dev'),
        N'Referencia de Luna a especialista en dermatología.', NULL,
        N'Programado', 9.9763000, -84.8382000, 9.9981000, -84.1198000,
        '2026-08-21 10:15:00', '2026-08-21 09:30:00');
END

IF NOT EXISTS (SELECT 1 FROM TrasladosExpediente
    WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Bella')
      AND VeterinariaOrigenId = (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas')
      AND VeterinariaDestinoId = (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago')
      AND EstadoLogistica = N'EnTransito')
BEGIN
    INSERT INTO TrasladosExpediente (MascotaId, VeterinariaOrigenId, VeterinariaDestinoId, Estado,
        FechaSolicitud, FechaRespuesta, SolicitadoPorId, Comentario, MotivoRechazo, EstadoLogistica,
        OrigenLatitud, OrigenLongitud, DestinoLatitud, DestinoLongitud, EtaLlegada, Salida)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Bella'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Hospital Veterinario Cartago'),
        N'Aceptado', '2026-08-21 12:00:00', '2026-08-21 13:00:00',
        (SELECT Id FROM Usuarios WHERE Email = 'david.chen@openpaw.dev'),
        N'Traslado de expediente por internación en Cartago.', NULL,
        N'EnTransito', 9.9763000, -84.8382000, 9.8644000, -83.9194000,
        '2026-08-21 14:00:00', '2026-08-21 13:15:00');
END

IF NOT EXISTS (SELECT 1 FROM TrasladosExpediente
    WHERE MascotaId = (SELECT Id FROM Mascotas WHERE Nombre = N'Rocky')
      AND VeterinariaOrigenId = (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia')
      AND VeterinariaDestinoId = (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas')
      AND EstadoLogistica = N'Completado')
BEGIN
    INSERT INTO TrasladosExpediente (MascotaId, VeterinariaOrigenId, VeterinariaDestinoId, Estado,
        FechaSolicitud, FechaRespuesta, SolicitadoPorId, Comentario, MotivoRechazo, EstadoLogistica,
        OrigenLatitud, OrigenLongitud, DestinoLatitud, DestinoLongitud, EtaLlegada, Salida)
    VALUES ((SELECT Id FROM Mascotas WHERE Nombre = N'Rocky'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'VetCare Heredia'),
        (SELECT Id FROM Veterinarias WHERE Nombre = N'Clínica Veterinaria Puntarenas'),
        N'Aceptado', '2026-08-14 09:00:00', '2026-08-14 10:00:00',
        (SELECT Id FROM Usuarios WHERE Email = 'laura.jimenez@openpaw.dev'),
        N'Historial clínico enviado a veterinaria de seguimiento.', NULL,
        N'Completado', 9.9981000, -84.1198000, 9.9763000, -84.8382000,
        '2026-08-15 11:30:00', '2026-08-15 10:45:00');
END

-- ---------------------------------------------------------------------------
-- VERIFICACION (descomentar para inspeccion)
-- ---------------------------------------------------------------------------
-- SELECT 'Usuarios' AS Tabla, COUNT(*) FROM Usuarios
-- UNION ALL SELECT 'Mascotas', COUNT(*) FROM Mascotas
-- UNION ALL SELECT 'Veterinarias', COUNT(*) FROM Veterinarias
-- UNION ALL SELECT 'Almacenes', COUNT(*) FROM Almacenes
-- UNION ALL SELECT 'Citas', COUNT(*) FROM Citas
-- UNION ALL SELECT 'Emergencias', COUNT(*) FROM Emergencias
-- UNION ALL SELECT 'Inventarios', COUNT(*) FROM Inventarios
-- UNION ALL SELECT 'TrasladosExpediente', COUNT(*) FROM TrasladosExpediente;

PRINT 'Seed demo (T11) aplicado correctamente (idempotente).';
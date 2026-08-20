Atención de emergencias con veterinario no cabecera
1. Contexto

OpenPaw permite registrar y consultar emergencias de mascotas atendidas por veterinarios que no necesariamente pertenecen a su veterinaria de cabecera.

Se contemplan dos escenarios:

Dentro de la plataforma: un veterinario registrado en OpenPaw registra la atención.
Fuera de la plataforma: el propietario registra una atención realizada en una veterinaria externa.

El objetivo es mantener estas atenciones registradas en el historial de la mascota.

2. Caso de uso
Objetivo

Registrar información de una emergencia, como mascota, fecha, motivo, síntomas, tratamiento, veterinaria y archivos relacionados.

Actores
Propietario: registra atenciones externas y consulta las emergencias de sus mascotas.
Veterinario: registra emergencias atendidas dentro de la plataforma, aunque no sea el veterinario de cabecera.
Administrador: puede consultar las emergencias del sistema.
3. Flujo A — Veterinario en la plataforma

El veterinario inicia sesión, selecciona la mascota y registra la emergencia indicando que la atención fue realizada en la plataforma.

El sistema verifica que:

El usuario sea veterinario.
Tenga una veterinaria asignada.
La veterinaria del usuario se asigne automáticamente a la emergencia.

Importante: no es necesario que sea la veterinaria de cabecera de la mascota.

Ejemplo

POST /api/emergencias

{
  "mascotaId": 1,
  "esEnPlataforma": true,
  "fechaAtencion": "2026-08-16T18:30:00Z",
  "motivo": "Convulsiones",
  "sintomas": "Movimientos involuntarios",
  "tratamientoAplicado": "Medicamento y observación"
}

Respuesta: 201 Created

{
  "id": 77,
  "mascotaId": 1,
  "propietarioId": 5,
  "veterinariaId": 10,
  "esEnPlataforma": true
}
4. Flujo B — Veterinario externo

Cuando la atención se realiza fuera de OpenPaw, el propietario registra posteriormente la información.

El sistema verifica que:

El usuario sea el propietario de la mascota.
La atención sea externa.
Se indique el nombre de la veterinaria.
Ejemplo

POST /api/emergencias

{
  "mascotaId": 1,
  "esEnPlataforma": false,
  "veterinariaNombreExterna": "Clinica 24h",
  "fechaAtencion": "2026-08-16T18:30:00Z",
  "motivo": "Convulsiones",
  "sintomas": "Movimientos involuntarios",
  "tratamientoAplicado": "Medicamento y observación"
}

Respuesta: 201 Created

{
  "id": 78,
  "mascotaId": 1,
  "propietarioId": 5,
  "veterinariaId": null,
  "veterinariaNombreExterna": "Clinica 24h",
  "esEnPlataforma": false
}
5. API de emergencias

Los endpoints requieren autenticación.

Base: /api/emergencias

Consultar emergencias de una mascota

GET /api/emergencias?mascotaId=1

Devuelve las emergencias registradas de la mascota cuando el usuario tiene permisos de acceso.

200 OK

[
  {
    "id": 77,
    "mascotaId": 1,
    "propietarioId": 5,
    "veterinariaId": 10,
    "motivo": "Convulsiones",
    "esEnPlataforma": true
  }
]
Consultar una emergencia

GET /api/emergencias/77

Devuelve la información de una emergencia específica.

Registrar una emergencia

POST /api/emergencias

Campo	Obligatorio	Descripción
mascotaId	Sí	Identificador de la mascota
esEnPlataforma	Sí	Indica si la atención fue en OpenPaw
veterinariaNombreExterna	Según escenario	Nombre de la veterinaria externa
fechaAtencion	Sí	Fecha de atención
motivo	Sí	Motivo de la emergencia
sintomas	No	Síntomas observados
tratamientoAplicado	No	Tratamiento realizado
archivoAdjuntoUrl	No	Archivo relacionado
Límites principales
Motivo: 1000 caracteres
Síntomas: 2000 caracteres
Tratamiento: 2000 caracteres
Veterinaria externa: 150 caracteres
Archivo adjunto: 500 caracteres
6. Errores principales
Código	Situación
200	Consulta realizada correctamente
201	Emergencia creada correctamente
400	Datos inválidos o falta información requerida
401	Usuario no autenticado
403	Usuario sin permisos
404	Recurso no encontrado
429	Límite de solicitudes excedido
500	Error interno del servidor

Por ejemplo, una atención externa sin nombre de veterinaria genera:

400 Bad Request

{
  "mensaje": "VeterinariaNombreExterna es obligatorio cuando el veterinario no esta en la plataforma"
}
7. Manual de usuario
Atención dentro de la plataforma
Iniciar sesión como veterinario.
Seleccionar la mascota.
Registrar la emergencia.
Indicar fecha, motivo, síntomas y tratamiento.
Seleccionar que la atención fue en la plataforma.
Guardar el registro.

La veterinaria se obtiene automáticamente del veterinario que registra la emergencia.

Atención fuera de la plataforma
Iniciar sesión como propietario.
Seleccionar la mascota.
Registrar la emergencia.
Indicar los datos de la atención.
Seleccionar que fue fuera de la plataforma.
Indicar el nombre de la veterinaria externa.
Guardar el registro.
8. Consulta y permisos

Las emergencias pueden ser consultadas según el rol y la relación con la mascota:

Propietario: puede consultar las emergencias de sus mascotas.
Veterinario: puede consultar las emergencias de mascotas de su veterinaria de cabecera.
Administrador: tiene acceso a las emergencias del sistema.
Usuarios sin autorización: reciben 403 Forbidden.
9. Modelo de datos

La entidad Emergencia almacena:

Id
MascotaId
PropietarioId
VeterinariaId
VeterinariaNombreExterna
FechaAtencion
Motivo
Sintomas
TratamientoAplicado
EsEnPlataforma
ArchivoAdjuntoUrl
FechaRegistro

La entidad se relaciona con Mascotas, Usuarios y Veterinarias. Además, Mascotas incorpora VeterinariaId para identificar su veterinaria de cabecera.

10. Pruebas realizadas

Se desarrollaron pruebas automatizadas para validar los principales escenarios, incluyendo:

Mascota o usuario inexistente.
Acceso de propietario, veterinario y administrador.
Veterinario que no es de cabecera.
Usuario sin relación con la mascota.
Registro dentro y fuera de la plataforma.
Usuario que no es propietario.
Falta de veterinaria externa.
Validación de campos y límites de longitud.

Estas pruebas permiten comprobar que los dos flujos de atención funcionen según las reglas establecidas para el PBI 133.
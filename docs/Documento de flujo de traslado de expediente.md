1. Descripción general

Se desarrolló una funcionalidad que permite al propietario solicitar el traslado del expediente de una mascota desde su veterinaria actual hacia otra.

La veterinaria de destino puede aceptar o rechazar la solicitud. Si la acepta, la veterinaria de cabecera de la mascota se actualiza automáticamente.

La funcionalidad incluye backend, API, base de datos, pruebas y la interfaz de usuario.

Componentes principales
Modelo TrasladoExpediente.
Repositorio ITrasladoExpedienteRepository.
Controlador TrasladosExpedienteController.
DTOs para crear y rechazar traslados.
Migración AddTrasladoExpediente.
Pruebas unitarias.
Página TrasladosPage.
Hook useTraslados.
Estilos de la funcionalidad.
2. Caso de uso
Objetivo

Permitir que el propietario solicite el traslado del expediente de su mascota hacia otra veterinaria y que esta pueda aceptar o rechazar la solicitud.

Actores
Actor	Acción
Propietario	Solicita el traslado del expediente.
Veterinaria	Acepta o rechaza la solicitud.
Administrador	Puede consultar los traslados registrados.
Flujo principal
El propietario selecciona la mascota y la veterinaria destino.
Envía la solicitud de traslado.
El sistema valida la información.
La solicitud queda en estado Solicitado.
La veterinaria destino recibe la solicitud.
Puede aceptarla o rechazarla.
Si se acepta, la veterinaria de cabecera de la mascota se actualiza.
Si se rechaza, se guarda el motivo del rechazo.
Estados
Solicitado
    ├──> Aceptado
    └──> Rechazado

Una solicitud que ya fue procesada no puede volver a aceptarse o rechazarse.

3. Solicitar un traslado

El propietario ingresa a Traslado de expediente y selecciona:

Mascota.
Veterinaria destino.
Comentario opcional.

La solicitud se realiza mediante:

POST /api/traslados-expediente
Ejemplo
{
  "mascotaId": 1,
  "veterinariaDestinoId": 20,
  "comentario": "Deseo continuar el seguimiento de mi mascota en esta veterinaria."
}

Si todo es correcto, el traslado se crea con estado Solicitado.

4. Aceptar un traslado

La veterinaria destino puede aceptar una solicitud pendiente mediante:

PUT /api/traslados-expediente/{id}/aceptar

Ejemplo:

PUT /api/traslados-expediente/100/aceptar

No requiere cuerpo.

La respuesta correcta es:

204 No Content

Al aceptar:

El traslado cambia de Solicitado a Aceptado.
Se registra la fecha de respuesta.
La veterinaria destino pasa a ser la nueva veterinaria de cabecera de la mascota.
5. Rechazar un traslado

Para rechazar una solicitud se utiliza:

PUT /api/traslados-expediente/{id}/rechazar

El motivo es obligatorio.

Ejemplo
{
  "motivoRechazo": "No contamos con disponibilidad para recibir el expediente."
}

Si se procesa correctamente:

204 No Content

El estado cambia a Rechazado y se guarda el motivo y la fecha de respuesta.

En este caso, la veterinaria actual de la mascota no cambia.

6. Consulta de traslados

Para consultar los traslados se utiliza:

GET /api/traslados-expediente

La información mostrada depende del usuario:

Administrador: puede consultar todos los traslados.
Veterinaria: consulta los traslados dirigidos a su veterinaria.
Propietario: consulta los traslados relacionados con sus mascotas.
Ejemplo de respuesta
[
  {
    "id": 100,
    "mascotaId": 1,
    "veterinariaOrigenId": 10,
    "veterinariaDestinoId": 20,
    "estado": "Solicitado",
    "fechaSolicitud": "2026-08-16T22:00:00Z",
    "solicitadoPorId": 5,
    "comentario": "Solicito el traslado."
  }
]
7. Validaciones y reglas de negocio

Para evitar errores, el sistema valida principalmente que:

La mascota exista.
El usuario sea propietario de la mascota.
La mascota tenga una veterinaria de cabecera.
La veterinaria destino exista.
La veterinaria destino sea diferente a la actual.
No exista otra solicitud activa para la misma mascota y veterinaria.
Solo la veterinaria destino pueda aceptar o rechazar.
La solicitud se encuentre en estado Solicitado.
El rechazo tenga un motivo.
Un traslado procesado no pueda procesarse nuevamente.
Principales códigos de error
Código	Situación
400	Datos inválidos, traslado duplicado o solicitud ya procesada.
403	El usuario no tiene permisos para realizar la acción.
404	Mascota, usuario, veterinaria o traslado no encontrado.
201	Traslado creado correctamente.
204	Traslado aceptado o rechazado correctamente.
8. Base de datos

Se creó la tabla:

TrasladosExpediente

La migración utilizada es:

AddTrasladoExpediente

La entidad mantiene relación con:

Mascotas
Veterinarias
Usuarios

Entre los principales datos almacenados se encuentran:

Id
MascotaId
VeterinariaOrigenId
VeterinariaDestinoId
Estado
FechaSolicitud
FechaRespuesta
SolicitadoPorId
Comentario
MotivoRechazo

También se agregaron índices para facilitar las consultas de mascotas, usuarios y veterinarias.

9. Interfaz de usuario

La funcionalidad fue agregada al frontend mediante:

TrasladosPage
useTraslados
TrasladosPage.css
Propietario

Puede:

Entrar a Traslado de expediente.
Presionar Solicitar traslado.
Seleccionar la mascota.
Seleccionar la veterinaria destino.
Agregar un comentario opcional.
Enviar la solicitud.
Consultar posteriormente su estado.
Veterinaria

La veterinaria cuenta con una sección de Solicitudes pendientes, donde puede ver:

Mascota.
Veterinaria de origen.
Usuario que realizó la solicitud.
Fecha.
Comentario.

También dispone de los botones:

Aceptar | Rechazar

Al rechazar, debe indicar obligatoriamente el motivo.

10. Ejemplo del flujo completo

Un propietario tiene a su mascota Max en la veterinaria 10 y desea trasladar su expediente a la veterinaria 20.

1. Solicitud

POST /api/traslados-expediente
{
  "mascotaId": 1,
  "veterinariaDestinoId": 20,
  "comentario": "Deseo continuar el tratamiento de Max en esta veterinaria."
}

El sistema crea la solicitud con estado:

Solicitado

2. La veterinaria destino consulta las solicitudes

GET /api/traslados-expediente

3. La veterinaria acepta

PUT /api/traslados-expediente/100/aceptar

4. Actualización

El traslado cambia:

Solicitado → Aceptado

Y la mascota pasa de:

Veterinaria 10 → Veterinaria 20

Si la veterinaria decide rechazarlo, se utiliza el endpoint de rechazo y se almacena el motivo. En ese caso, la veterinaria de cabecera de Max permanece sin cambios.

11. Pruebas

Se realizaron pruebas unitarias para comprobar los principales escenarios de la funcionalidad, incluyendo:

Creación de traslados.
Mascota inexistente.
Usuario que no es propietario.
Veterinaria inexistente.
Solicitudes duplicadas.
Aceptación de traslados.
Rechazo de traslados.
Usuarios sin permisos.
Traslados ya procesados.
Actualización de la veterinaria de cabecera.
Almacenamiento del motivo de rechazo.

Las pruebas utilizan xUnit, Moq y FluentAssertions.

12. Resultado

Con esta funcionalidad se puede gestionar de forma controlada el traslado de un expediente entre veterinarias. El sistema registra la solicitud, controla quién puede aceptarla o rechazarla y actualiza automáticamente la veterinaria de cabecera cuando corresponde.

Además, el proceso queda respaldado por validaciones, persistencia en la base de datos, endpoints de la API, interfaz gráfica y pruebas automatizadas.
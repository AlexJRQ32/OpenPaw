Aporte de Expediente Externo
Contexto

La funcionalidad de Aporte de Expediente Externo permite que los propietarios registren información médica de sus mascotas cuando fueron atendidas en una veterinaria que no utiliza OpenPaw. Su objetivo es mantener un historial clínico completo dentro de la plataforma mediante el modelo de datos, la API y las pruebas desarrolladas en las tareas 141 a la 144.

Caso de uso
Objetivo

Permitir que el propietario agregue información de una atención veterinaria externa al expediente de su mascota.

Actor

Propietario de la mascota.

Precondiciones

El usuario debe haber iniciado sesión.

La mascota debe existir.

El usuario debe ser el propietario de la mascota.

Flujo principal

Ingresar al expediente de la mascota.

Seleccionar Crear aporte.

Escribir el nombre de la veterinaria (texto libre).

Completar la información de la atención.

Guardar el aporte.

El sistema valida y registra la información en el expediente.

Resumen del flujo

Propietario autenticado

Crear aporte

Veterinaria de texto libre

Guardar en el expediente

Reglas de negocio

Solo el propietario puede crear, consultar y eliminar aportes.

La mascota debe existir.

La veterinaria se registra como texto libre.

La fecha de atención no puede estar en el futuro.

El sistema asigna automáticamente el propietario y la fecha de registro.

Campos obligatorios

Campo

	

Obligatorio




Mascota

	

Sí




Nombre de la veterinaria

	

Sí




Fecha de atención

	

Sí




Tipo de atención

	

Sí




Descripción

	

Sí

Campos opcionales

Diagnóstico

Medicamentos

Archivo adjunto (URL)

Flujos alternativos

Eliminar aporte

El propietario puede eliminar un aporte registrado, siempre que sea quien lo creó.

Adjuntos

Es posible agregar una URL con un archivo relacionado; este campo es opcional.

Documentación de la API

Base del controlador:

/api/expediente-aportes

Todos los endpoints requieren autenticación mediante JWT.

Obtener aportes

GET /api/expediente-aportes?mascotaId=15

Request

GET /api/expediente-aportes?mascotaId=15
Authorization: Bearer {token}

Respuesta (200 OK)

[
  {
    "id": 1,
    "mascotaId": 15,
    "veterinariaNombre": "Clínica Externa",
    "tipoAtencion": "Consulta",
    "descripcion": "Consulta de rutina"
  }
]

Errores

Código

	

Descripción




403

	

El usuario no es propietario.




404

	

La mascota no existe.

Crear un aporte

POST /api/expediente-aportes

Request

{
  "mascotaId": 15,
  "veterinariaNombre": "Clínica Externa",
  "fechaAtencion": "2026-08-09T15:30:00Z",
  "tipoAtencion": "Consulta",
  "descripcion": "Consulta de rutina",
  "diagnostico": "Sin complicaciones",
  "medicamentos": "Vitaminas"
}

Respuesta (201 Created)

Location: /api/expediente-aportes/50
{
  "id": 50,
  "mascotaId": 15,
  "veterinariaNombre": "Clínica Externa",
  "tipoAtencion": "Consulta",
  "descripcion": "Consulta de rutina"
}

Errores

Código

	

Descripción




400

	

La fecha está en el futuro.




403

	

El usuario no es propietario.




404

	

La mascota no existe.

Eliminar un aporte

DELETE /api/expediente-aportes/{id}

Request

DELETE /api/expediente-aportes/50
Authorization: Bearer {token}

Respuesta

204 No Content

Errores

Código

	

Descripción




403

	

El aporte pertenece a otro usuario.




404

	

El aporte no existe.

Resumen de respuestas HTTP

Código

	

Significado




200

	

Consulta exitosa




201

	

Aporte creado




204

	

Eliminación exitosa




400

	

Datos inválidos




403

	

Sin permisos




404

	

Recurso no encontrado

Manual de usuario

Esta función permite guardar en OpenPaw la información de una atención realizada en una veterinaria que no usa la plataforma.

Cómo agregar un aporte

Iniciar sesión como propietario.

Entrar al perfil de la mascota.

Abrir Aportes de Expediente.

Seleccionar Crear aporte.

Completar el nombre de la veterinaria, la fecha, el tipo de atención y la descripción.

Guardar el aporte.

Si las validaciones son correctas, el registro aparecerá inmediatamente en el expediente de la mascota.

Pasos reproducibles

Iniciar sesión como propietario.

Abrir una mascota propia.

Crear un aporte con una veterinaria externa.

Confirmar que aparezca en GET /api/expediente-aportes.

Eliminar el aporte.

Verificar que ya no aparezca en el listado.
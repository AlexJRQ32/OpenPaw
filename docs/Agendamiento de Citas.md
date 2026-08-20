Flujo de Agendamiento de Citas
El proceso de reserva dentro de la plataforma abarca desde la selección de la clínica hasta la confirmación de la solicitud. A continuación, se detalla el paso a paso del flujo técnico y las validaciones involucradas.
1. Selección de la Clínica
Todo comienza cuando la persona elige la veterinaria donde quiere llevar a su mascota. Al enviar la petición a POST /api/Citas, la API incluye el parámetro VeterinariaId.
Antes de guardar nada, el sistema consulta IVeterinariaRepository para asegurar que el establecimiento efectivamente exista en la base de datos. Si no se encuentra el registro, la petición se corta de inmediato y devuelve un error.
2. Elección del Servicio
Con la veterinaria confirmada, se selecciona la prestación requerida. Esta oferta se gestiona desde el módulo ServiciosVeterinarios, que expone las rutas necesarias para traer la lista de opciones que cada clínica configuró previamente.
Cada opción mapea contra la entidad ServicioVeterinario, la cual agrupa atributos como:
•	Nombre del servicio y su descripción
•	Categoría
•	Tarifa o precio
•	Tiempo estimado de atención
•	Estado actual (si está activo o no para agendar)
Esto le da autonomía a cada clínica para mantener su propio catálogo de prestaciones al día.
3. Asignación de Fecha y Hora
Definido el servicio, el usuario indica cuándo desea la atención. En este punto, la API corre dos comprobaciones críticas:
1.	Tiempo futuro: La fecha solicitada no puede ser menor a la hora actual.
2.	Sin solapamientos: La clínica no debe tener compromisos en ese mismo bloque horario.
Para verificar la disponibilidad, CitaRepository llama al método ExisteConflictoAsync. Este evalúa las reservas existentes dentro de una ventana de 30 minutos para prevenir traslapes. Si alguna de estas reglas no se cumple, la cita no se registra.
4. Guardado y Cambios de Estado
Si todas las validaciones pasan, la API crea la nueva entidad Cita guardando la información clave:
•	Identificadores de Mascota, Usuario y Veterinaria
•	Servicio elegido
•	Fecha, hora y notas adicionales
•	Importe a pagar y marca de tiempo de creación
Por defecto, toda cita nace con el estado Pendiente. A partir de ahí, la gestión del ciclo de vida se maneja mediante distintas rutas:
•	Confirmación o cambios de estado: PUT /api/Citas/{id}
•	Reagendamiento: PATCH /api/Citas/{id}/reprogramar
•	Cancelación: PATCH /api/Citas/{id}/cancelar o directo vía DELETE /api/Citas/{id}
5. Tema Recordatorios
Por el momento, la API no envía avisos automáticos por correo, SMS ni notificaciones push. El flujo termina una vez que la cita queda registrada en la base de datos. La idea es sumar un módulo de notificaciones o conectar un proveedor externo en versiones posteriores.
Resumen de Validaciones de Negocio
Para garantizar la integridad de los datos, la API valida siempre:
•	Que existan en el sistema la mascota, el usuario y la veterinaria.
•	Que el horario solicitado sea a futuro.
•	Que no haya choque de horarios en la misma clínica.
•	Que no se intenten reprogramar citas que ya fueron canceladas (exige cambiar el estado primero).
Mapeo de Componentes
•	CitasController: Controla la creación, edición, reprogramación y baja de citas.
•	ICitaRepository / CitaRepository: Acceso a datos de citas y lógica para evaluar conflictos de horario.
•	ServiciosVeterinariosController: Expone los servicios que ofrece cada veterinaria.
•	ServicioVeterinario: Entidad con el catálogo de prestaciones.
•	IVeterinariaRepository / IMascotaRepository / IUsuarioRepository: Validadores de existencia para cada entidad relacionada.

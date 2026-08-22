namespace OpenPawDevs.Core.Enums;

/// <summary>
/// Sprint 1 - Tarea 10: estado LOGISTICO del traslado de expediente (visualizacion del
/// wireframe de Traslados: En Transito / Programado / Completado).
/// Es un ciclo PARALELO al de aprobacion (<see cref="EstadoTraslado"/>: Solicitado/Aceptado/Rechazado)
/// que se mantiene intacto; este enum alimenta el campo EstadoLogistica de la entidad
/// TrasladoExpediente para el mapa, la ETA y el timeline de ruta.
/// </summary>
public enum EstadoTrasladoLogistica
{
    Programado = 1,
    EnTransito = 2,
    Completado = 3
}
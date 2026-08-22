using TrasladoEntity = OpenPawDevs.Core.Entities.TrasladoExpediente;

namespace OpenPawDevs.Core.DTOs.Traslado;

/// <summary>
/// Sprint 1 - Tarea 10: mapeo compartido entre entidad <see cref="TrasladoEntity"/> y DTOs.
/// Centralizado para que el controller y los tests usen la misma logica.
/// </summary>
public static class TrasladoExpedienteMapeo
{
    public static TrasladoExpedienteDto ToDto(TrasladoEntity t)
    {
        return new TrasladoExpedienteDto
        {
            Id = t.Id,
            MascotaId = t.MascotaId,
            VeterinariaOrigenId = t.VeterinariaOrigenId,
            VeterinariaDestinoId = t.VeterinariaDestinoId,
            Estado = t.Estado,
            FechaSolicitud = t.FechaSolicitud,
            FechaRespuesta = t.FechaRespuesta,
            SolicitadoPorId = t.SolicitadoPorId,
            Comentario = t.Comentario,
            MotivoRechazo = t.MotivoRechazo,
            EstadoLogistica = t.EstadoLogistica,
            OrigenLatitud = t.OrigenLatitud,
            OrigenLongitud = t.OrigenLongitud,
            DestinoLatitud = t.DestinoLatitud,
            DestinoLongitud = t.DestinoLongitud,
            EtaLlegada = t.EtaLlegada,
            Salida = t.Salida
        };
    }

    /// <summary>
    /// Actualizacion parcial de los campos de logistica del wireframe:
    /// null en el DTO preserva el valor actual de la entidad.
    /// </summary>
    public static void AplicarActualizacion(TrasladoEntity entity, ActualizarTrasladoExpedienteDto dto)
    {
        if (dto.OrigenLatitud.HasValue)
            entity.OrigenLatitud = dto.OrigenLatitud;
        if (dto.OrigenLongitud.HasValue)
            entity.OrigenLongitud = dto.OrigenLongitud;
        if (dto.DestinoLatitud.HasValue)
            entity.DestinoLatitud = dto.DestinoLatitud;
        if (dto.DestinoLongitud.HasValue)
            entity.DestinoLongitud = dto.DestinoLongitud;
        if (dto.EstadoLogistica != null)
            entity.EstadoLogistica = dto.EstadoLogistica;
        if (dto.EtaLlegada.HasValue)
            entity.EtaLlegada = dto.EtaLlegada;
        if (dto.Salida.HasValue)
            entity.Salida = dto.Salida;
    }
}
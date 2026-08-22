namespace OpenPawDevs.Core.DTOs.Traslado;

/// <summary>
/// Sprint 1 - Tarea 10: respuesta del traslado de expediente. Incluye los campos del
/// wireframe de Traslados (coordenadas, ETA, estado logístico, salida) ademas del ciclo
/// de aprobación existente. Sin PII: no expone datos personales del propietario.
/// </summary>
public class TrasladoExpedienteDto
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int VeterinariaOrigenId { get; set; }
    public int VeterinariaDestinoId { get; set; }

    // Ciclo de aprobación (Solicitado/Aceptado/Rechazado) — se conserva intacto.
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaSolicitud { get; set; }
    public DateTime? FechaRespuesta { get; set; }
    public int SolicitadoPorId { get; set; }
    public string? Comentario { get; set; }
    public string? MotivoRechazo { get; set; }

    // Sprint 1 - Tarea 10: ciclo logístico paralelo (Programado/EnTransito/Completado).
    public string EstadoLogistica { get; set; } = "Programado";
    public decimal? OrigenLatitud { get; set; }
    public decimal? OrigenLongitud { get; set; }
    public decimal? DestinoLatitud { get; set; }
    public decimal? DestinoLongitud { get; set; }
    public DateTime? EtaLlegada { get; set; }
    public DateTime? Salida { get; set; }
}
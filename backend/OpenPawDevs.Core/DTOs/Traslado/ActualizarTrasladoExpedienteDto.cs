using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Traslado;

/// <summary>
/// Sprint 1 - Tarea 10: actualizacion parcial del traslado (campos de logistica del wireframe).
/// Todos los campos son opcionales: null en el DTO preserva el valor actual en la entidad
/// (ver <see cref="TrasladoExpedienteMapeo.AplicarActualizacion"/>). No modifica el ciclo de
/// aprobacion (Estado/FechaRespuesta/MotivoRechazo se gestionan solo en aceptar/rechazar).
/// </summary>
public class ActualizarTrasladoExpedienteDto
{
    [Range(-90d, 90d, ErrorMessage = "La latitud de origen debe estar entre -90 y 90.")]
    public decimal? OrigenLatitud { get; set; }

    [Range(-180d, 180d, ErrorMessage = "La longitud de origen debe estar entre -180 y 180.")]
    public decimal? OrigenLongitud { get; set; }

    [Range(-90d, 90d, ErrorMessage = "La latitud de destino debe estar entre -90 y 90.")]
    public decimal? DestinoLatitud { get; set; }

    [Range(-180d, 180d, ErrorMessage = "La longitud de destino debe estar entre -180 y 180.")]
    public decimal? DestinoLongitud { get; set; }

    // Estado logico de transporte validado en el controller con Enum.TryParse+IsDefined -> 400
    // y normalizado a enum.ToString() (patron tarea 7). null preserva el valor actual.
    [StringLength(20)]
    public string? EstadoLogistica { get; set; }

    public DateTime? EtaLlegada { get; set; }
    public DateTime? Salida { get; set; }
}
using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Traslado;

public class CrearTrasladoExpedienteDto
{
    [Range(1, int.MaxValue)]
    public int MascotaId { get; set; }

    [Range(1, int.MaxValue)]
    public int VeterinariaDestinoId { get; set; }

    [StringLength(1000)]
    public string? Comentario { get; set; }

    // Sprint 1 - Tarea 10: campos del wireframe de Traslados (logistica de transporte).
    // Coordenadas para el mapa Leaflet punto a punto entre veterinarias (patron tarea 6:
    // decimal(10,7) en BD, validacion de rango en DTO).
    [Range(-90d, 90d, ErrorMessage = "La latitud de origen debe estar entre -90 y 90.")]
    public decimal? OrigenLatitud { get; set; }

    [Range(-180d, 180d, ErrorMessage = "La longitud de origen debe estar entre -180 y 180.")]
    public decimal? OrigenLongitud { get; set; }

    [Range(-90d, 90d, ErrorMessage = "La latitud de destino debe estar entre -90 y 90.")]
    public decimal? DestinoLatitud { get; set; }

    [Range(-180d, 180d, ErrorMessage = "La longitud de destino debe estar entre -180 y 180.")]
    public decimal? DestinoLongitud { get; set; }

    // Estado logico de transporte: string legible validado en el controller con
    // Enum.TryParse+IsDefined -> 400 y normalizado a enum.ToString() (patron tarea 7).
    // Opcional: si no viene, la entidad arranca en "Programado".
    [StringLength(20)]
    public string? EstadoLogistica { get; set; }

    // Hora estimada de llegada (wireframe: "Destino -> ETA 10:15 AM") y hora de salida
    // (wireframe: "Origen -> Salida 09:30 AM").
    public DateTime? EtaLlegada { get; set; }
    public DateTime? Salida { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Aporte;

/// <summary>
/// Sprint 2 - Tarea 36: actualizacion parcial de un aporte de expediente (rediseño UI).
/// Todos los campos son opcionales: null en el DTO preserva el valor actual en la entidad
/// (update parcial, null preserva). No se pueden modificar MascotaId ni PropietarioId
/// (la pertenencia del aporte es inmutable). TipoAtencion es un string legible validado
/// en el controller con Enum.TryParse+IsDefined -> 400 y normalizado a enum.ToString()
/// (patron tarea 7).
/// </summary>
public class ActualizarAporteExpedienteDto
{
    [StringLength(150, MinimumLength = 1)]
    public string? VeterinariaNombre { get; set; }

    public DateTime? FechaAtencion { get; set; }

    // Nombre canonico del enum TipoAtencion (Consulta/Tratamiento/Vacuna/Emergencia),
    // case-insensitive. null preserva el valor actual.
    [StringLength(20)]
    public string? TipoAtencion { get; set; }

    [StringLength(2000, MinimumLength = 1)]
    public string? Descripcion { get; set; }

    [StringLength(1000)]
    public string? Diagnostico { get; set; }

    [StringLength(1000)]
    public string? Medicamentos { get; set; }

    // Debe ser una direccion http/https valida (validado en el controller con Uri.TryCreate,
    // patron RedesSocialesController). null preserva el valor actual.
    [StringLength(500)]
    public string? ArchivoAdjuntoUrl { get; set; }
}

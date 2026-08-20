using System.ComponentModel.DataAnnotations;
using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.DTOs.Aporte;

public class CrearAporteExpedienteDto
{
    [Range(1, int.MaxValue)]
    public int MascotaId { get; set; }

    [Required]
    [StringLength(150, MinimumLength = 1)]
    public string VeterinariaNombre { get; set; } = string.Empty;

    [Required]
    public DateTime FechaAtencion { get; set; }

    [Required]
    public TipoAtencion TipoAtencion { get; set; }

    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Descripcion { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Diagnostico { get; set; }

    [StringLength(1000)]
    public string? Medicamentos { get; set; }

    [StringLength(500)]
    public string? ArchivoAdjuntoUrl { get; set; }
}

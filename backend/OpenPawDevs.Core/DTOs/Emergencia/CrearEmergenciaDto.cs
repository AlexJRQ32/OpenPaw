using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Emergencia;

public class CrearEmergenciaDto
{
    [Range(1, int.MaxValue)]
    public int MascotaId { get; set; }

    [Required]
    public bool EsEnPlataforma { get; set; }

    [StringLength(150)]
    public string? VeterinariaNombreExterna { get; set; }

    [Required]
    public DateTime FechaAtencion { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Motivo { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Sintomas { get; set; }

    [StringLength(2000)]
    public string? TratamientoAplicado { get; set; }

    [StringLength(500)]
    public string? ArchivoAdjuntoUrl { get; set; }
}

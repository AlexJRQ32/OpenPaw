using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Emergencia;

/// <summary>
/// DTO de actualizacion parcial de una emergencia: los campos null preservan el
/// valor existente en la entidad (consistente con el patron de Mascota/EstadoSalud).
/// </summary>
public class ActualizarEmergenciaDto
{
    public DateTime? FechaAtencion { get; set; }

    [StringLength(1000, MinimumLength = 1)]
    public string? Motivo { get; set; }

    [StringLength(2000)]
    public string? Sintomas { get; set; }

    [StringLength(2000)]
    public string? TratamientoAplicado { get; set; }

    [StringLength(500)]
    public string? ArchivoAdjuntoUrl { get; set; }

    [StringLength(30)]
    public string? NivelSeveridad { get; set; }

    [Range(1, 300)]
    public int? FrecuenciaCardiaca { get; set; }

    [Range(1, 100)]
    public int? SaturacionO2 { get; set; }

    [Range(30, 46)]
    public decimal? Temperatura { get; set; }

    [StringLength(100)]
    public string? EstadoPaciente { get; set; }

    [StringLength(150)]
    public string? MedicoACargo { get; set; }

    [StringLength(2000)]
    public string? Diagnostico { get; set; }
}
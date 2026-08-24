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

    // Sprint 1 - Emergencias: severidad, signos vitales, tratamiento, medico (T4)
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

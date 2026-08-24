namespace OpenPawDevs.Core.DTOs.Emergencia;

/// <summary>
/// DTO de respuesta de una emergencia (Sprint 1 - Emergencias: severidad, signos
/// vitales, tratamiento, medico). No expone la entidad cruda ni sus navegaciones
/// (Mascota/Propietario/Veterinaria) para evitar PII innecesaria.
/// </summary>
public class EmergenciaDto
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int PropietarioId { get; set; }
    public int? VeterinariaId { get; set; }
    public string? VeterinariaNombreExterna { get; set; }
    public DateTime FechaAtencion { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Sintomas { get; set; }
    public string? TratamientoAplicado { get; set; }
    public bool EsEnPlataforma { get; set; }
    public string? ArchivoAdjuntoUrl { get; set; }
    public DateTime FechaRegistro { get; set; }

    public string NivelSeveridad { get; set; } = "Nivel1_Critico";
    public int? FrecuenciaCardiaca { get; set; }
    public int? SaturacionO2 { get; set; }
    public decimal? Temperatura { get; set; }
    public string? EstadoPaciente { get; set; }
    public string? MedicoACargo { get; set; }
    public string? Diagnostico { get; set; }
}
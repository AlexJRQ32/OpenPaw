namespace OpenPawDevs.Core.Entities;

/// <summary> PBI 133 - Atención de emergencias (veterinario no cabecera, dentro y fuera de la plataforma) </summary>
public class Emergencia
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
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    // Sprint 1 - Emergencias: severidad, signos vitales, tratamiento, medico (T4)
    public string NivelSeveridad { get; set; } = "Nivel1_Critico";
    public int? FrecuenciaCardiaca { get; set; }
    public int? SaturacionO2 { get; set; }
    public decimal? Temperatura { get; set; }
    public string? EstadoPaciente { get; set; }
    public string? MedicoACargo { get; set; }
    public string? Diagnostico { get; set; }

    public virtual Mascota? Mascota { get; set; }
    public virtual Usuario? Propietario { get; set; }
    public virtual Veterinaria? Veterinaria { get; set; }
}

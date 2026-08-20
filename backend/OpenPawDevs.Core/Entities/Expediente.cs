namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 6 - Atender Consulta: Expediente clínico de una mascota </summary>
public class Expediente
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int VeterinariaId { get; set; }
    public DateTime FechaConsulta { get; set; }
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
    public string? Observaciones { get; set; }
    public string? RecetaUrl { get; set; }
    public string? ArchivoUrl { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual Mascota? Mascota { get; set; }
    public virtual Veterinaria? Veterinaria { get; set; }
    public virtual ICollection<ExpedienteCompartido>? ExpedientesCompartidos { get; set; }
}
